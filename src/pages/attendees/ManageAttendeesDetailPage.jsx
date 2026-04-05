import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { attendeeService } from '@/services';
import * as XLSX from 'xlsx';

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

  const handleDownloadExcel = useCallback(() => {
    if (!filteredAttendees.length) {
      toast.error('No attendees to export');
      return;
    }

    try {
      const excelData = filteredAttendees.map((attendee, index) => ({
        'No.': index + 1,
        'Name': attendee.name || '—',
        'Email': attendee.email || '—',
        'Contact': attendee.contact || '—',
        'Registered At': formatDateTime(attendee.registered_at),
        'Status': renderStatusLabel(attendee.status),
        'Ticket ID': attendee.registration_id || '—',
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const colWidths = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 40 },
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');

      const eventName = eventInfo.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event';
      const fileName = `${eventName}_Attendees_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success('Excel file downloaded successfully');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Failed to export Excel file');
    }
  }, [filteredAttendees, eventInfo.title]);

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
      <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Attendees Management</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-blue-100">
              <span className="font-medium text-white">{eventInfo.title || '—'}</span>
              {eventInfo.start_time && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateTime(eventInfo.start_time)}
                </span>
              )}
              {eventInfo.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {eventInfo.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/manage-attendees')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white font-medium"
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
          {/* Scanner Launch Card */}
          <div className="mb-6">
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
            
            {/* Error message */}
            {scannerError && !showScanner && (
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

          {/* QR Scanner Popup Modal */}
          {showScanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 0h.01M12 12v4m0 4h.01M12 12h.01M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">QR Code Scanner</h3>
                      <p className="text-gray-400 text-sm">Position the QR code within the frame</p>
                    </div>
                  </div>
                  <button
                    onClick={stopScanner}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Camera View - Same aspect-square as original */}
                <div className="relative w-full aspect-square max-w-md mx-auto m-4 bg-black rounded-xl overflow-hidden">
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
                    <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                      <p className="text-white text-lg font-semibold mb-1">Position QR code in frame</p>
                      <p className="text-gray-300 text-sm">Camera is active and scanning</p>
                    </div>
                  </div>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Camera active - scanning...</span>
                    </div>
                    <button
                      onClick={stopScanner}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close Scanner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Attendee List</h2>
              <p className="text-gray-500 text-sm mt-1">
                {filteredAttendees.length} {filteredAttendees.length === 1 ? 'attendee' : 'attendees'} found
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-56 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
              
              <button
                onClick={handleDownloadExcel}
                disabled={!hasData}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hasData ? (
                filteredAttendees.map((attendee, index) => (
                  <tr 
                    key={attendee.registration_id} 
                    className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    {/* Attendee Info with Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {attendee.name ? attendee.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{attendee.name || '—'}</p>
                          <p className="text-xs text-gray-500 truncate">{attendee.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-gray-600">{attendee.contact || '—'}</span>
                      </div>
                    </td>
                    
                    {/* Registered At */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">{formatDateTime(attendee.registered_at)}</span>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadge(attendee.status)}`}>
                        {attendee.status === 'CHECKED_IN' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {attendee.status === 'NOT_CHECKED_IN' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {renderStatusLabel(attendee.status)}
                      </span>
                    </td>
                    
                    {/* Ticket ID */}
                    <td className="px-6 py-4">
                      <div className="relative group/tooltip">
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono cursor-help">
                          {attendee.registration_id?.slice(0, 8)}...
                        </code>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap z-10">
                          {attendee.registration_id}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteAttendee(attendee.registration_id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deleteMutation.isPending ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">
                        {isFetching ? 'Loading attendees...' : 'No attendees found'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {!isFetching && searchTerm ? 'Try adjusting your search' : ''}
                      </p>
                    </div>
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
