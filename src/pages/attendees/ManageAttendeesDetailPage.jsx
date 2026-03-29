import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { attendeeService } from '@/services';

const FILE_SCANNER_ID = 'qr-file-scanner';

export const ManageAttendeesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [qrAlertData, setQrAlertData] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const html5QrCodeRef = useRef(null);
  const fileScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['event-attendees', id],
    queryFn: () => attendeeService.getEventAttendees(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });

  const attendeeData = data?.data ?? {};
  const eventInfo = attendeeData.event ?? {};
  const stats = attendeeData.stats ?? {
    total_attendees: 0,
    total_checked_in: 0,
    total_not_checked_in: 0,
  };
  const attendees = attendeeData.attendees ?? [];

  const statusOptions = useMemo(() => {
    const unique = new Set(attendees.map((attendee) => attendee.status).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [attendees]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      const searchFields = [
        attendee.name,
        attendee.email,
        attendee.contact,
        attendee.registration_id,
        attendee.user_id,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchFields.some((field) => field?.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        selectedStatus === 'all' || attendee.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [attendees, normalizedSearch, selectedStatus]);

  const totalAttendees = stats.total_attendees ?? attendees.length;
  const checkedInAttendees = stats.total_checked_in ?? attendees.filter((a) => a.status === 'CHECKED_IN').length;
  const notCheckedInAttendees =
    stats.total_not_checked_in ?? Math.max(totalAttendees - checkedInAttendees, 0);

  const isInitialLoading = isLoading && !data;
  const queryErrorMessage = isError
    ? error?.response?.data?.message || error?.message || 'Failed to fetch attendees'
    : null;

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\w/g, (match) => match.toUpperCase());
  };

  const extractTicketInfo = (rawValue) => {
    const info = {
      qrTicketId: '',
      payload: null,
      text: '',
      metadata: {},
    };

    if (typeof rawValue === 'string') {
      info.text = rawValue;
      try {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          info.payload = parsed;
        }
      } catch {
        // ignore JSON parse errors – raw string will be used as identifier
      }
    } else if (rawValue && typeof rawValue === 'object') {
      info.payload = rawValue;
      info.text = JSON.stringify(rawValue);
    }

    const payload = info.payload;
    if (payload) {
      const candidateFields = [
        payload.qr_ticket_id,
        payload.qrTicketId,
        payload.qr_ticket,
        payload.qrTicket,
        payload.registration_id,
        payload.registrationId,
        payload.ticket_id,
        payload.ticketId,
      ];
      const candidate = candidateFields.find((val) => typeof val === 'string' && val.trim());
      if (candidate) {
        info.qrTicketId = candidate.trim();
      }

      const eventId = payload.event_id ?? payload.eventId;
      if (eventId) info.metadata.eventId = eventId;
      const userId = payload.user_id ?? payload.userId;
      if (userId) info.metadata.userId = userId;
      const registrationId = payload.registration_id ?? payload.registrationId;
      if (registrationId) info.metadata.registrationId = registrationId;
      info.metadata.payload = payload;
    }

    if (!info.qrTicketId && typeof rawValue === 'string' && rawValue.trim()) {
      info.qrTicketId = rawValue.trim();
    }

    if (!info.text) {
      info.text = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue ?? '');
    }

    return info;
  };

  const handleScanQRCode = async () => {
    try {
      setScanning(true);
      setShowScanner(true);
      setScannerError(null);
      setQrAlertData(null);

      // Wait for the DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        throw new Error('Scanner container not found. Please try again.');
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Try to get available cameras first
      let cameraId = null;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Prefer back camera (environment), fallback to first available
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          cameraId = backCamera ? backCamera.id : devices[0].id;
        }
      } catch (err) {
        console.log('Could not enumerate cameras, using default', err);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      // Try with specific camera ID first, then fallback to facingMode
      try {
        if (cameraId) {
          await html5QrCode.start(
            cameraId,
            config,
            (decodedText, decodedResult) => {
              handleDecodedQRCode(decodedText, decodedResult);
              stopScanner();
            },
            (errorMessage) => {
              // Error callback - ignore for continuous scanning
            }
          );
        } else {
          // Fallback to facingMode
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText, decodedResult) => {
              handleDecodedQRCode(decodedText, decodedResult);
              stopScanner();
            },
            (errorMessage) => {
              // Error callback - ignore for continuous scanning
            }
          );
        }
      } catch (cameraErr) {
        // If environment camera fails, try user camera (front)
        try {
          await html5QrCode.start(
            { facingMode: 'user' },
            config,
            (decodedText, decodedResult) => {
              handleDecodedQRCode(decodedText, decodedResult);
              stopScanner();
            },
            (errorMessage) => {
              // Error callback - ignore for continuous scanning
            }
          );
        } catch (userCameraErr) {
          throw new Error('Unable to access any camera. Please check permissions and ensure no other application is using the camera.');
        }
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      let errorMessage = 'Failed to start camera. ';
      
      if (err.message) {
        if (err.message.includes('Permission')) {
          errorMessage += 'Please grant camera permissions in your browser settings.';
        } else if (err.message.includes('NotFoundError') || err.message.includes('NotReadableError')) {
          errorMessage += 'No camera found or camera is being used by another application.';
        } else if (err.message.includes('NotAllowedError')) {
          errorMessage += 'Camera access denied. Please allow camera access and try again.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'Please ensure camera permissions are granted and try again.';
      }
      
      setScannerError(errorMessage);
      setScanning(false);
      setShowScanner(false);

      // Clean up if initialization failed
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
        html5QrCodeRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setScanning(false);
      setShowScanner(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const checkInMutation = useMutation({
    mutationFn: ({ qrTicketId }) => attendeeService.checkInAttendee(qrTicketId),
    onSuccess: (response) => {
      const message = response?.message || 'Check-in successful';
      const normalizedMessage = message.toLowerCase();
      const alreadyChecked = normalizedMessage.includes('already checked in');
      const toastMessage = alreadyChecked ? 'You are already checked in' : message;

      if (alreadyChecked) {
        toast.error(toastMessage);
      } else {
        toast.success(toastMessage);
      }

      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });

      setQrAlertData((prev) => {
        const next = {
          ...(prev || {}),
          message: toastMessage,
          error: alreadyChecked,
        };

        if (response?.registration) {
          const { event_title, user_name, email, checked_in_at } = response.registration;
          next.registration = {
            eventTitle: event_title,
            userName: user_name,
            email,
            checkedInAt: checked_in_at,
          };
        }

        return next;
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.message || mutationError?.message || 'Failed to check in attendee';
      toast.error(message);
      setQrAlertData((prev) => ({
        ...(prev || {}),
        message,
        error: true,
      }));
    },
  });

  const checkInWithQrTicketId = (qrTicketId, metadata) => {
    if (!qrTicketId) {
      toast.error('QR ticket identifier is missing.');
      setQrAlertData((prev) => ({
        ...(prev || {}),
        message: 'QR ticket identifier is missing.',
        error: true,
      }));
      return;
    }

    setQrAlertData((prev) => ({
      ...(prev || {}),
      ...metadata,
      scannedAt: new Date().toISOString(),
    }));

    checkInMutation.mutate({ qrTicketId });
  };

  const handleDecodedQRCode = (decodedText, decodedResult = {}) => {
    if (!decodedText) {
      toast.error('QR code was empty.');
      return;
    }

    try {
      const ticketInfo = extractTicketInfo(decodedText);
      setTicketCode((prev) => prev); // Leave manual input unchanged
      const formatName =
        decodedResult?.result?.format?.formatName ||
        decodedResult?.format?.formatName ||
        decodedResult?.formatName ||
        decodedResult?.decodedFormat ||
        'QR_CODE';

      const metadata = {
        text: ticketInfo.text,
        format: formatName,
        source: decodedResult?.source || 'camera',
        ...ticketInfo.metadata,
      };

      if (!ticketInfo.qrTicketId) {
        throw new Error('QR ticket identifier is missing.');
      }

      checkInWithQrTicketId(ticketInfo.qrTicketId, metadata);
    } catch (err) {
      console.error('Failed to parse QR data:', err);
      const message =
        err instanceof SyntaxError
          ? 'QR code does not contain valid JSON data.'
          : err.message || 'Invalid QR code data.';
      toast.error(message);
      setQrAlertData((prev) => ({
        ...(prev || {}),
        message,
        error: true,
        text: typeof decodedText === 'string' ? decodedText : JSON.stringify(decodedText),
        format:
          decodedResult?.result?.format?.formatName ||
          decodedResult?.format?.formatName ||
          decodedResult?.formatName ||
          decodedResult?.decodedFormat ||
          'QR_CODE',
        source: decodedResult?.source || 'camera',
        scannedAt: new Date().toISOString(),
      }));
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setScannerError(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(FILE_SCANNER_ID);
      const decodedText = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      handleDecodedQRCode(decodedText, { source: 'upload' });
      setShowScanner(false);
    } catch (err) {
      console.error('Image QR scan error:', err);
      toast.error('Unable to read QR code from the selected image.');
    } finally {
      setScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualCheckIn = () => {
    if (!ticketCode.trim()) {
      toast.error('Please enter QR data to check in.');
      return;
    }

    try {
      const ticketInfo = extractTicketInfo(ticketCode);

      if (!ticketInfo.qrTicketId) {
        throw new Error('QR ticket identifier is missing.');
      }

      const metadata = {
        text: ticketInfo.text,
        format: 'MANUAL_INPUT',
        source: 'manual',
        ...ticketInfo.metadata,
      };

      checkInWithQrTicketId(ticketInfo.qrTicketId, metadata);
      setTicketCode('');
    } catch (err) {
      const message =
        err instanceof SyntaxError
          ? 'Manual input must contain a QR ticket identifier or valid JSON with a supported identifier.'
          : err.message || 'Invalid manual QR data.';
      toast.error(message);
      setQrAlertData({
        text: ticketCode,
        format: 'MANUAL_INPUT',
        source: 'manual',
        scannedAt: new Date().toISOString(),
        message,
        error: true,
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      CHECKED_IN: 'bg-green-100 text-green-800',
      NOT_CHECKED_IN: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const deleteMutation = useMutation({
    mutationFn: ({ eventId, registrationId }) =>
      attendeeService.deleteAttendee(eventId, registrationId),
    onSuccess: () => {
      toast.success('Attendee removed');
      refetch();
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.message || mutationError?.message || 'Failed to delete attendee';
      toast.error(message);
    },
  });

  const handleDeleteAttendee = (registrationId) => {
    if (!window.confirm('Remove this attendee from the event?')) {
      return;
    }
    if (!id || !registrationId) {
      toast.error('Invalid attendee information');
      return;
    }
    deleteMutation.mutate({ eventId: id, registrationId });
  };

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasData = attendees.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendees Management</h1>
            <p className="text-gray-600 mt-1">
              {eventInfo.title || '—'}
              {eventInfo.start_time ? ` • ${formatDateTime(eventInfo.start_time)}` : ''}
            </p>
            {eventInfo.location && (
              <p className="text-gray-500 text-sm mt-1">{eventInfo.location}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/manage-attendees')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Events</span>
          </button>
        </div>
      </div>

      {queryErrorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {queryErrorMessage}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Attendees Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-blue-200 p-6 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-blue-200 rounded-full">
              <span className="text-xs font-semibold text-blue-800">Total</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Attendees</p>
            <p className="text-4xl font-bold text-blue-900">{totalAttendees}</p>
            <p className="text-xs text-blue-600 mt-2">All registered participants</p>
          </div>
        </div>

        {/* Checked In Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg border-2 border-green-200 p-6 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-green-200 rounded-full">
              <span className="text-xs font-semibold text-green-800">
                {totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-green-700 mb-1">Checked In</p>
            <p className="text-4xl font-bold text-green-900">{checkedInAttendees}</p>
            <p className="text-xs text-green-600 mt-2">Successfully verified</p>
          </div>
        </div>

        {/* Not yet Checked In Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl shadow-lg border-2 border-orange-200 p-6 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="px-3 py-1 bg-orange-200 rounded-full">
              <span className="text-xs font-semibold text-orange-800">Pending</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-700 mb-1">Not yet Checked In</p>
            <p className="text-4xl font-bold text-orange-900">{notCheckedInAttendees}</p>
            <p className="text-xs text-orange-600 mt-2">Awaiting verification</p>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 0h.01M12 12v4m0 4h.01M12 12h.01M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">QR Code Scanner</h2>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* QR Code Scanner View */}
          <div className="mb-6">
            {scanning && showScanner ? (
              <div className="relative w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl">
                {/* Camera View */}
                <div id="qr-reader" className="w-full h-full"></div>
                
                {/* Overlay with instructions */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Viewfinder frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-blue-500 rounded-lg shadow-lg relative">
                      {/* Corner decorations */}
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                    <p className="text-white text-lg font-semibold mb-1">Position QR code in frame</p>
                    <p className="text-gray-300 text-sm">Camera is active and scanning</p>
                  </div>
                  
                  {/* Stop button */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={stopScanner}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Stop
                    </button>
                  </div>
                </div>
                
              </div>
            ) : (
              <div 
                className="relative w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-lg border-2 border-blue-200 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                onClick={handleScanQRCode}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  {/* QR Code Icon */}
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 0h.01M12 12v4m0 4h.01M12 12h.01M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-indigo-400 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  </div>
                  
                  {/* Text */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                    Ready to Scan
                  </h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Click here or use the button below to start scanning QR codes
                  </p>
                  
                  {/* Decorative pattern */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-100/50 to-transparent"></div>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {scannerError && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-bold text-lg mb-2">Camera Access Error</p>
                    <p className="text-red-700 text-sm mb-4">{scannerError}</p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Troubleshooting steps:</p>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        <li>Check if your browser has camera permissions enabled</li>
                        <li>Ensure no other application is using the camera</li>
                        <li>Try refreshing the page and granting permissions again</li>
                        <li>Make sure you're using HTTPS (required for camera access)</li>
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleScanQRCode}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </button>
                      <button
                        onClick={() => {
                          setScannerError(null);
                          setScanning(false);
                          setShowScanner(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scan Button */}
          <div className="mb-6">
            {scanning && showScanner ? (
              <button
                onClick={stopScanner}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Stop
              </button>
            ) : (
              <button
                onClick={handleScanQRCode}
                disabled={scanning}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Start Camera Scanner
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Enter Ticket Code Manually
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Enter ticket code (e.g., TICKET-ABC123)"
                  className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
              </div>
              <button
                onClick={handleManualCheckIn}
                disabled={!ticketCode.trim() || checkInMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                {checkInMutation.isPending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v2m0 12v2m8-8h-2M6 12H4m13.657-6.343L18 7.757M6 17.657L4.343 19.314m14.314 0L18 16.243M6 6L4.343 4.343" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {checkInMutation.isPending ? 'Processing...' : 'Check In'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendee List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Attendee List</h2>
          <p className="text-gray-600 text-sm">View and manage all registered attendees</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            {statusOptions
              .filter((status) => status !== 'all')
              .map((status) => (
                <option key={status} value={status}>
                  {renderStatusLabel(status)}
                </option>
              ))}
          </select>
        </div>

        {/* Attendees Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasData ? (
                filteredAttendees.map((attendee) => (
                  <tr key={attendee.registration_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attendee.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.contact || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateTime(attendee.registered_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(attendee.status)}`}>
                        {renderStatusLabel(attendee.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.registration_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteAttendee(attendee.registration_id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteMutation.isPending ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    {isFetching ? 'Loading attendees...' : 'No attendees found for this event.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
