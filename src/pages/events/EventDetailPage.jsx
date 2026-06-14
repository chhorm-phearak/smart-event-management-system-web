import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eventService } from '@/services';

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const formatTimeFromISO = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!isValidDate(date)) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const mapAgenda = (agenda) => {
  if (!agenda) return [];
  if (Array.isArray(agenda) && agenda.length === 0) return [];
  const list = Array.isArray(agenda) ? agenda : [agenda];
  return list.filter(a => a && typeof a === 'object').map((a, i) => ({
    id: a.id ?? i,
    title: a.title ?? a.name ?? '—',
    description: a.description ?? '',
    startTime: a.start_time ? formatTimeFromISO(a.start_time) : (a.startTime || ''),
    endTime: a.end_time ? formatTimeFromISO(a.end_time) : (a.endTime || ''),
    speaker: a.speaker ?? '',
    duration: a.duration ?? 0,
  }));
};

/** Normalize API response: handles various response structures */
const getEventPayload = (res) => {
  if (!res || typeof res !== 'object') return null;
  
  // If res already has id, title, agenda - it's the event object directly
  if (res.id && res.title) {
    return res;
  }
  
  // Handle { event: { ... } }
  if (res.event && typeof res.event === 'object') {
    return res.event;
  }
  
  // Handle { data: { ... } } wrapper (shouldn't happen since service returns response.data)
  if (res.data && typeof res.data === 'object') {
    if (res.data.event) return res.data.event;
    if (res.data.id) return res.data;
    return res.data;
  }
  
  return res;
};

const formatDuration = (minutes) => {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const mapStaff = (staff) => {
  if (!staff || !Array.isArray(staff)) return [];
  return staff.map((s) => ({
    id: s.id,
    firstName: s.first_name ?? s.firstName ?? '',
    lastName: s.last_name ?? s.lastName ?? '',
    email: s.email ?? '',
    role: s.role ?? 'Staff',
  }));
};

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_EVENT_IMAGE;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const mapRawToEvent = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const images = raw.images ?? raw.event_images ?? [];
  const firstImage = Array.isArray(images) ? images[0] : images;
  const rawImageUrl =
    (firstImage && typeof firstImage === 'object' && (firstImage.image_url ?? firstImage.url)) ||
    (typeof firstImage === 'string' ? firstImage : null) ||
    raw.primary_image_url ||
    null;
  const imageUrl = resolveImageUrl(rawImageUrl);
  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? '—',
    shortDescription: raw.short_description ?? raw.shortDescription ?? '',
    description: raw.long_description ?? raw.longDescription ?? raw.short_description ?? raw.shortDescription ?? '',
    category: raw.category ?? 'Other',
    eventDate: raw.start_time ?? raw.startTime,
    startTime: (raw.start_time ?? raw.startTime) ? formatTimeFromISO(raw.start_time ?? raw.startTime) : '',
    endTime: (raw.end_time ?? raw.endTime) ? formatTimeFromISO(raw.end_time ?? raw.endTime) : '',
    duration: raw.duration ?? 0,
    durationFormatted: formatDuration(raw.duration),
    location: raw.location ?? '—',
    fullAddress: raw.full_address ?? raw.fullAddress ?? raw.location ?? '—',
    capacity: raw.capacity ?? 0,
    registered: raw.number_of_registered ?? raw.registered ?? raw.attendees_count ?? 0,
    price: raw.price ?? 0,
    organizer: raw.organization_name ?? raw.organizationName ?? raw.organizer ?? '—',
    organizationId: raw.organization_id ?? raw.organizationId ?? '',
    status: raw.status ?? 'DRAFT',
    isPublic: raw.is_public ?? raw.isPublic ?? true,
    image: imageUrl,
    images: Array.isArray(images)
      ? images.map((img) => resolveImageUrl(img?.image_url ?? img?.url ?? img))
      : [],
    qrcode: (raw.qr_image_url || raw.qrcode) ?? raw.qr_code ?? '',
    qrTicket: raw.qr_ticket ?? raw.qrTicket ?? raw.ticket_code ?? raw.code ?? '',
    registrationRequired: raw.registration_required ?? true,
    qrCodeAvailable: raw.qr_code_available ?? true,
    bringValidId: raw.bring_valid_id ?? true,
    agendas: mapAgenda(raw.agenda ?? raw.agendas),
    staff: mapStaff(raw.staff),
    groupName: raw.group_name ?? raw.groupName ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
};

export const EventDetailPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { id } = useParams();
  const fromGroup = location.state?.fromGroup;
  const fromDashboard = location.state?.fromDashboard;
  const fromManageEvents = location.state?.fromManageEvents;
  const [registeredQrCode, setRegisteredQrCode] = useState('');
  const [registeredTicketCode, setRegisteredTicketCode] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Try to get cached event from the events list (which includes agenda and staff)
  const getCachedEventFromList = (eventId) => {
    if (!eventId) return null;
    // Get ALL cached queries (not just 'events' key)
    const allQueries = queryClient.getQueryCache().getAll();
    for (const query of allQueries) {
      const queryKey = query.queryKey;
      // Check if this is an events-related query
      if (Array.isArray(queryKey) && queryKey[0] === 'events') {
        const cachedData = query.state.data;
        if (!cachedData) continue;
        
        const list = Array.isArray(cachedData)
          ? cachedData
          : cachedData?.events ?? cachedData?.data?.events ?? [];
        if (!Array.isArray(list)) continue;
        
        const found = list.find((item) => item?.id === eventId);
        if (found) {
          console.log('[EventDetail] Found cached event in query:', queryKey);
          return found;
        }
      }
    }
    return null;
  };

  const { data: event, isLoading: loading, error, isFetching } = useQuery({
    queryKey: ['event', 'detail', id],
    queryFn: async () => {
      // First try to get from cached events list (has agenda & staff)
      const cachedEvent = getCachedEventFromList(id);
      
      // If we have cached data with agenda/staff, use it directly
      if (cachedEvent?.id) {
        console.log('[EventDetail] Using cached event with agenda/staff');
        const mapped = mapRawToEvent(cachedEvent);
        return mapped;
      }
      
      // Otherwise fetch from API
      const response = await eventService.getEventById(id);
      // The detail endpoint returns { event, images, agenda, staff } as siblings.
      // Pick the right container, then merge sibling collections onto the event
      // so mapRawToEvent can find images/agenda/staff.
      const container = response?.data ?? response ?? {};
      const baseEvent = container.event ?? container;
      if (!baseEvent?.id) return null;

      const apiEvent = {
        ...baseEvent,
        images: baseEvent.images ?? container.images ?? [],
        agenda: baseEvent.agenda ?? container.agenda ?? baseEvent.agendas ?? [],
        staff: baseEvent.staff ?? container.staff ?? [],
      };

      const mapped = mapRawToEvent(apiEvent);
      return mapped;
    },
    staleTime: 0,
    refetchOnMount: true,
    enabled: !!id,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events', 'all-for-registration-status'],
    queryFn: async () => {
      const res = await eventService.getAllEvents();
      return res?.data?.events ?? res?.events ?? [];
    },
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: (eventId) => eventService.registerForEvent(eventId),
    onSuccess: (response) => {
      const payload = response?.data ?? response ?? {};
      const qrImage =
        payload?.qrcode ??
        payload?.qr_code ??
        response?.qrcode ??
        response?.qr_code ??
        '';
      const qrTicket =
        payload?.qr_ticket ??
        response?.qr_ticket ??
        payload?.qrTicket ??
        response?.qrTicket ??
        '';
      if (qrImage) setRegisteredQrCode(qrImage);
      if (qrTicket) setRegisteredTicketCode(qrTicket);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Registered successfully.');
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to register event.';
      toast.error(message);
    },
  });

  const eventFromAllEvents = allEvents.find((item) => item?.id === id);
  const eventQrCode = (
    registeredQrCode ||
    (eventFromAllEvents?.qr_image_url || eventFromAllEvents?.qrcode) ||
    eventFromAllEvents?.qr_code ||
    (event?.qr_image_url || event?.qrcode) ||
    ''
  ).trim();
  const eventTicketCode = (
    registeredTicketCode ||
    eventFromAllEvents?.qr_ticket ||
    eventFromAllEvents?.ticket_code ||
    eventFromAllEvents?.code ||
    event?.qrTicket ||
    event?.qr_ticket ||
    ''
  ).trim();
  const hasQrImage = Boolean(eventQrCode);
  const hasTicketCode = Boolean(eventTicketCode);
  const isRegistered = hasQrImage || hasTicketCode;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (!isValidDate(date)) return '—';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    if (timeString.includes('T') || String(timeString).match(/^\d{4}-\d{2}-\d{2}/)) {
      const formatted = formatTimeFromISO(timeString);
      return formatted || '—';
    }
    const [hours, minutes] = String(timeString).split(':');
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const formatTimeRange = (start, end) => {
    const s = formatTime(start);
    const e = formatTime(end);
    if (s === '—' && e === '—') return '—';
    return `${s} - ${e}`;
  };

  const handleRegister = () => {
    if (!id) {
      toast.error('Missing event id.');
      return;
    }
    registerMutation.mutate(id);
  };

  const handleShowQrTicket = () => {
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
  };

  const handleDownloadQr = async () => {
    if (!hasQrImage) {
      toast.error('No QR code available to download.');
      return;
    }

    try {
      // Set filename based on event title and current date
      // Sanitize filename: replace characters not allowed in filenames with underscores
      // This regex allows letters, numbers, spaces, and common punctuation, but replaces others.
      const sanitizedName = event.title.replace(/[/\\?%*:#|"<>&.]/g, '_').trim();
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${sanitizedName}_qr_${timestamp}.png`;
      
      if (eventQrCode.startsWith('data:')) {
        // Handle base64 data
        const link = document.createElement('a');
        link.href = eventQrCode;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle URL - use canvas to convert image to blob (bypasses CORS for download)
        const qrUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${eventQrCode}`;
        
        // Create an image element
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Try to request with CORS
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // If CORS fails, fallback to simple download
            const link = document.createElement('a');
            link.href = qrUrl;
            link.download = filename;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve();
          };
          img.src = qrUrl;
        });
        
        // If image loaded successfully, convert to blob via canvas
        if (img.complete && img.naturalHeight !== 0) {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
          }, 'image/png');
        }
      }
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code. Please try again.');
    }
  };

  const handleCopyTicketCode = async () => {
    if (!eventTicketCode) {
      toast.error('No ticket code available to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(eventTicketCode);
      toast.success('Ticket code copied.');
    } catch {
      toast.error('Failed to copy ticket code.');
    }
  };

  const attendancePercentage = event?.capacity
    ? Math.round((event.registered / event.capacity) * 100)
    : 0;

  const handleBack = () => {
    if (fromGroup) {
      navigate(`/groups/${fromGroup}`);
    } else if (fromDashboard) {
      navigate('/');
    } else if (fromManageEvents) {
      navigate('/manage-events');
    } else {
      navigate('/all-events');
    }
  };

  if (loading && !event) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{error ? 'Failed to load event.' : 'Event not found'}</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {fromGroup ? 'Back to Group' : 'Back to Events'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">{fromGroup ? 'Back to Group' : fromDashboard ? 'Dashboard' : fromManageEvents ? 'Manage Events' : 'All Events'}</span>
          </button>
          
          <div className="flex items-center gap-3">
            {isRegistered && (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                ✓ Registered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - Split Layout */}
      <div className="lg:grid lg:grid-cols-2">
        {/* Left - Image */}
        <div className="relative h-[40vh] lg:h-auto lg:sticky lg:top-0">
          <img 
            src={event.image} 
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              if (e.target.src !== FALLBACK_EVENT_IMAGE) {
                e.target.src = FALLBACK_EVENT_IMAGE;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white/20"></div>
          
          {/* Price Badge */}
          <div className="absolute bottom-6 left-6 lg:bottom-auto lg:top-24 lg:left-6">
            <div className="bg-white text-gray-900 px-5 py-2 rounded-full font-bold text-xl shadow-lg">
              {event.price === 0 ? 'FREE' : `$${event.price}`}
            </div>
          </div>
        </div>

        {/* Right - Content */}
        <div className="relative bg-white px-6 lg:px-12 py-10 lg:py-24 lg:overflow-y-auto">
          {/* Category */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full">
              {event.category}
            </span>
            {event.isPublic && (
              <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                Public Event
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {event.title}
          </h1>

          {/* Short Description */}
          {event.shortDescription && (
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">{event.shortDescription}</p>
          )}

          {/* Event Meta Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm font-medium">Date</span>
              </div>
              <p className="text-gray-900 font-semibold">{formatDate(event.eventDate)}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm font-medium">Time</span>
              </div>
              <p className="text-gray-900 font-semibold">{formatTimeRange(event.startTime, event.endTime)}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm font-medium">Duration</span>
              </div>
              <p className="text-gray-900 font-semibold">{event.durationFormatted || `${event.duration} min`}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-gray-500 text-sm font-medium">Location</span>
              </div>
              <p className="text-gray-900 font-semibold truncate">{event.location}</p>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-medium">Attendance</span>
              <span className="text-gray-900 font-semibold">{event.registered} / {event.capacity} spots</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${attendancePercentage}%` }}
              ></div>
            </div>
            <p className="text-gray-500 text-sm mt-2">{attendancePercentage}% filled</p>
          </div>

          {/* CTA Button */}
          {!isRegistered ? (
            <button
              onClick={handleRegister}
              disabled={registerMutation.isPending}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? 'Processing...' : 'Register Now'}
            </button>
          ) : (
            <button
              onClick={handleShowQrTicket}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-colors"
            >
              View My Ticket
            </button>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          {/* About Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Event</h2>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </section>

          {/* Schedule Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Event Schedule</h2>
              {event.agendas && event.agendas.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                  {event.agendas.length} {event.agendas.length === 1 ? 'Session' : 'Sessions'}
                </span>
              )}
            </div>
            
            {event.agendas && event.agendas.length > 0 ? (
              <div className="space-y-4">
                {event.agendas.map((agenda, index) => (
                  <div 
                    key={agenda.id || index}
                    className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-6 transition-colors"
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                            {agenda.startTime || '—'} - {agenda.endTime || '—'}
                          </span>
                          {agenda.duration > 0 && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg">
                              {agenda.duration} min
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{agenda.title}</h3>
                        {agenda.description && (
                          <p className="text-gray-500">{agenda.description}</p>
                        )}
                        {agenda.speaker && (
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                              {agenda.speaker.charAt(0)}
                            </div>
                            <span className="text-gray-600 font-medium">{agenda.speaker}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 font-medium">No schedule available yet</p>
              </div>
            )}
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Team</h2>
            
            {event.staff && event.staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.staff.map((member) => (
                  <div 
                    key={member.id}
                    className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {member.firstName?.charAt(0) || member.lastName?.charAt(0) || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mt-1">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-400 font-medium">No team members assigned</p>
              </div>
            )}
          </section>

          {/* Info Cards Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Organizer */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">Hosted By</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {event.organizer?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{event.organizer}</p>
                    <p className="text-gray-500 text-sm">Organization</p>
                  </div>
                </div>
                {event.groupName && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-500 text-sm">Group: <span className="text-gray-900 font-medium">{event.groupName}</span></p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">Venue</h3>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{event.location}</p>
                    <p className="text-gray-500 text-sm mt-1">{event.fullAddress}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">Requirements</h3>
                <ul className="space-y-3">
                  {event.registrationRequired && (
                    <li className="flex items-center gap-3 text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Registration required</span>
                    </li>
                  )}
                  {event.qrCodeAvailable && (
                    <li className="flex items-center gap-3 text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">QR code ticket</span>
                    </li>
                  )}
                  {event.bringValidId && (
                    <li className="flex items-center gap-3 text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Bring valid ID</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* QR Ticket Modal */}
      {showQrModal && event && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold">Your Ticket</h2>
                    <p className="text-blue-100 text-base">Present this QR code at the event</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseQrModal}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ticket Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex flex-col gap-6 mb-6 w-full">
                {/* Event Info Card - Full width, above QR */}
                <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>
                  <div className="space-y-3 text-base text-gray-700">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(event.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{formatTimeRange(event.startTime, event.endTime)}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section - Full width, below detail */}
                <div className="w-full bg-white border-2 border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center">
                  <div className="w-72 h-72 bg-white border-4 border-blue-100 rounded-xl p-5 mb-4 flex items-center justify-center shadow-inner">
                    {hasQrImage ? (
                      <img
                        src={eventQrCode.startsWith('data:') ? eventQrCode : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${eventQrCode}`}
                        alt="Ticket QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDR2MW02IDExaDJtLTYgMGgtMnY0bTAtMTF2M20wMGguMDFNMTIgMTJoNC4wMU0xNiAyMGg0TTQgMTJoNG0xMiAwaC4wMU01IDhoMmExIDEgMCAwMDEtMVY1YTEgMSAwIDAwLTEtMUg1YTEgMSAwIDAwLTEgMXYyYTEgMSAwIDAwMSAxem0xMiAwaDJhMSAxIDAgMDAxLTFWNWExIDEgMCAwMC0xLTFoLTJhMSAxIDAgMDAtMSAxdjJhMSAxIDAgMDAxIDF6TTUgMjBoMmExIDEgMCAwMTEtMXYtMmExIDEgMCAwMC0xLTFINWExIDEgMCAwMC0xIDF2MmExIDEgMCAwMTEgMXoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-56 h-56 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center font-medium">
                    Scan this QR code at the event entrance
                  </p>
                </div>
              </div>

              {/* Ticket Code Section */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Ticket Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-5 py-4 bg-white border-2 border-gray-300 rounded-lg font-mono font-semibold text-lg text-gray-900 text-center">
                    {hasTicketCode ? eventTicketCode : 'N/A'}
                  </div>
                  <button
                    onClick={handleCopyTicketCode}
                    disabled={!hasTicketCode}
                    className="px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy ticket code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Copy</span>
                  </button>
                </div>
              </div>

              
              {/* Modal Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleCloseQrModal}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-base"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
