import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '@/services';
import { getApiOrigin } from '@/utils';
import { QRCodeSVG } from 'qrcode.react';

const FALLBACK_EVENT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="28">Event image not available</text></svg>'
)}`;

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const formatTimeFromISO = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!isValidDate(date)) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getEventPayload = (res) => {
  if (!res || typeof res !== 'object') return null;
  const data = res.data ?? res;
  if (data && typeof data === 'object' && data.event != null) return data.event;
  return data ?? res.event ?? res;
};

const getRegisteredEventsPayload = (res) => {
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.events)) return res.events;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.events)) return res.data.events;
  return [];
};

const mapAgenda = (agenda) => {
  if (!agenda) return [];
  const list = Array.isArray(agenda) ? agenda : [agenda];
  return list.map((a, i) => ({
    id: a?.id ?? i,
    title: a?.title ?? a?.name ?? '—',
    description: a?.description ?? '',
    startTime: a?.start_time ?? a?.startTime ?? '',
    endTime: a?.end_time ?? a?.endTime ?? '',
    speaker: a?.speaker ?? '',
  }));
};

const toAbsoluteImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  const apiOrigin = getApiOrigin();
  if (value.startsWith('/')) return `${apiOrigin}${value}`;
  return `${apiOrigin}/${value}`;
};

const extractRawImageValue = (raw) => {
  if (!raw || typeof raw !== 'object') return '';
  const images = raw.images ?? raw.event_images ?? [];
  const firstImage = Array.isArray(images) ? images[0] : images;
  const imageFromCollection =
    (firstImage && typeof firstImage === 'object' && (firstImage.image_url ?? firstImage.url ?? firstImage.image ?? firstImage.path)) ||
    (typeof firstImage === 'string' ? firstImage : '');
  return (
    imageFromCollection ||
    raw.image_url ||
    raw.image ||
    raw.cover_image ||
    raw.thumbnail ||
    ''
  );
};

const mapRawToEvent = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const imageUrl = toAbsoluteImageUrl(extractRawImageValue(raw)) || FALLBACK_EVENT_IMAGE;

  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? '—',
    shortDescription: raw.short_description ?? raw.shortDescription ?? '',
    description: raw.long_description ?? raw.longDescription ?? raw.short_description ?? raw.shortDescription ?? '',
    category: raw.category ?? 'Other',
    eventDate: raw.start_time ?? raw.startTime ?? raw.event_date ?? raw.date ?? '',
    startTime: raw.start_time ?? raw.startTime ?? '',
    endTime: raw.end_time ?? raw.endTime ?? '',
    location: raw.location ?? '—',
    fullAddress: raw.full_address ?? raw.fullAddress ?? raw.location ?? '—',
    capacity: raw.capacity ?? 0,
    registered: raw.registered ?? raw.attendees_count ?? 0,
    price: raw.price ?? 0,
    organizer: raw.organization_name ?? raw.organizationName ?? raw.organizer ?? '—',
    image: imageUrl,
    qrcode: raw.qrcode ?? raw.qr_code ?? '',
    registrationRequired: raw.registration_required ?? true,
    qrCodeAvailable: raw.qr_code_available ?? true,
    bringValidId: raw.bring_valid_id ?? true,
    agendas: mapAgenda(raw.agenda ?? raw.agendas),
  };
};

export const MyTicketEventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      if (!id) {
        setEvent(null);
        setTicketCode('');
        return;
      }

      const [eventRes, registeredRes] = await Promise.all([
        eventService.getEventById(id),
        eventService.getRegisteredEvents().catch(() => null),
      ]);

      const rawEvent = getEventPayload(eventRes);
      const mappedEvent = mapRawToEvent(rawEvent);
      if (!mappedEvent) {
        setEvent(null);
        setTicketCode('');
        return;
      }

      const registeredEvents = getRegisteredEventsPayload(registeredRes);
      const registeredEvent = registeredEvents.find((item) => {
        const registeredEventId = item?.event_id ?? item?.eventId ?? item?.id;
        return String(registeredEventId) === String(id);
      });

      const qrCode =
        registeredEvent?.qrcode ??
        registeredEvent?.qr_code ??
        registeredEvent?.ticket_code ??
        registeredEvent?.code ??
        mappedEvent.qrcode ??
        '';
      const registeredImage = toAbsoluteImageUrl(extractRawImageValue(registeredEvent));

      setEvent({
        ...mappedEvent,
        image: registeredImage || mappedEvent.image || FALLBACK_EVENT_IMAGE,
        qrcode: qrCode || mappedEvent.qrcode,
      });
      setTicketCode(qrCode || '');
    } catch (error) {
      console.error('Error fetching event details:', error);
      setEvent(null);
      setTicketCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQrTicket = () => {
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
  };

  const handleDownloadQr = () => {
    // Download functionality would go here
    console.log('Downloading QR ticket...');
  };

  const handleCopyTicketCode = async () => {
    if (!ticketCode) return;
    try {
      await navigator.clipboard.writeText(ticketCode);
    } catch (error) {
      console.error('Failed to copy ticket code:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (!isValidDate(date)) return '—';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    if (String(timeString).includes('T') || String(timeString).match(/^\d{4}-\d{2}-\d{2}/)) {
      return formatTimeFromISO(timeString) || '—';
    }
    const [hours, minutes] = String(timeString).split(':');
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return '—';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const attendancePercentage = event?.capacity ? Math.round((event.registered / event.capacity) * 100) : 0;
  const isRegistered = Boolean(ticketCode);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Event not found</p>
        <button
          onClick={() => navigate('/my-ticket')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to My Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => navigate('/my-ticket')}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to My Tickets</span>
      </button>

      {/* Event Image */}
      <div className="mb-6">
        <img 
          src={event.image || FALLBACK_EVENT_IMAGE}
          alt={event.title}
          className="w-full h-64 object-cover rounded-lg shadow-sm"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_EVENT_IMAGE;
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purple Banner Background */}
          <div className="bg-purple-100 rounded-lg p-6">
            {/* Category Tag */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {event.category}
              </span>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{event.title}</h1>

            {/* Event Description */}
            <p className="text-gray-600 leading-relaxed">
              {event.shortDescription || event.description}
            </p>
          </div>

          {/* Date & Time and Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Date & Time</h3>
              </div>
              <div className="space-y-1">
                <p className="text-gray-900 font-bold text-lg">{formatDate(event.eventDate)}</p>
                <p className="text-gray-700 font-semibold text-base">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Location</h3>
              </div>
              <div className="space-y-1">
                <p className="text-gray-900 font-bold text-lg">{event.location}</p>
                <p className="text-gray-700 font-semibold text-base">{event.fullAddress}</p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Event Information</h2>
            
            <div className="space-y-5">
              {/* Organizer */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Organized by</p>
                  <p className="text-base font-semibold text-gray-900">{event.organizer}</p>
                </div>
              </div>

              {/* Attendance */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Attendance</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-900">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${attendancePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About This Event */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Agenda */}
          {event.agendas && event.agendas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Agenda</h2>
              <div className="space-y-4">
                {event.agendas.map((agenda, index) => (
                  <div key={agenda.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            {formatTime(agenda.startTime)} - {formatTime(agenda.endTime)}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{agenda.title}</h3>
                        {agenda.description && (
                          <p className="text-sm text-gray-600 mb-2">{agenda.description}</p>
                        )}
                        {agenda.speaker && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-sm text-gray-600">Speaker: {agenda.speaker}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            {/* Pricing Section */}
            <div className="bg-blue-600 rounded-lg p-6 mb-4">
              <div className="text-white text-center">
                <div className="text-4xl font-bold">
                  {event.price === 0 ? 'Free' : `$${event.price}`}
                </div>
                <div className="text-sm text-blue-100 mt-2">per ticket</div>
              </div>
            </div>

            {/* Show QR Ticket Button - Always show since coming from My Ticket */}
            <button
              onClick={handleShowQrTicket}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm mb-4"
            >
              Show Qr Ticket
            </button>

            {/* Registered Status - Always show since coming from My Ticket */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">Registered!</span>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Requirements:</h3>
              {event.registrationRequired && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Registration is required</span>
                </div>
              )}
              {event.qrCodeAvailable && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>QR code available after registration</span>
                </div>
              )}
              {event.bringValidId && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Bring valid ID to the event</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Ticket Modal */}
      {showQrModal && event && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Your Ticket</h2>
                    <p className="text-blue-100 text-sm">Present this QR code at the event</p>
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

            {/* Ticket Content */}
            <div className="p-6">
              {/* Event Info Card */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 mb-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 bg-white border-4 border-blue-100 rounded-xl p-4 mb-4 flex items-center justify-center shadow-inner">
                    {isRegistered ? (
                      <QRCodeSVG value={ticketCode} size={185} level="M" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 text-center px-4">
                        No ticket code available
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    Scan this QR code at the event entrance
                  </p>
                </div>
              </div>

              {/* Ticket Code Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Ticket Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-mono font-semibold text-gray-900 text-center">
                    {ticketCode || 'Not available'}
                  </div>
                  <button
                    onClick={handleCopyTicketCode}
                    disabled={!isRegistered}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    title="Copy ticket code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Copy</span>
                  </button>
                </div>
              </div>

              {/* Important Notice */}
              {event.bringValidId && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Important</p>
                      <p className="text-xs text-yellow-800">
                        Please arrive 15 minutes early. Bring a valid ID for verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseQrModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
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
