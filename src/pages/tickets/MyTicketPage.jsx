import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { eventService } from '@/services';
import { getApiOrigin } from '@/utils';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  QrCode,
  X,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Filter,
  Copy,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const formatTimeFromISO = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!isValidDate(date)) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getRegisteredEventsPayload = (res) => {
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.events)) return res.events;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.events)) return res.data.events;
  return [];
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

const mapRawTicket = (raw, index = 0) => {
  const images = raw?.images ?? raw?.event_images ?? [];
  const firstImage = Array.isArray(images) ? images[0] : images;
  const rawImageUrl =
    (firstImage && typeof firstImage === 'object' && (firstImage.image_url ?? firstImage.url)) ||
    (typeof firstImage === 'string' ? firstImage : null) ||
    raw?.image_url ||
    raw?.image;
  const imageUrl = toAbsoluteImageUrl(rawImageUrl) || 'https://via.placeholder.com/1200x400?text=Event';

  const start = raw?.start_time ?? raw?.startTime ?? '';
  const fallbackTime = formatTimeFromISO(start);

  const qrImage = (
    (raw?.qr_image_url || raw?.qrcode) ??
    raw?.qr_code ??
    ''
  ).toString().trim();
  const qrTicket = (
    raw?.qr_ticket ??
    raw?.qrTicket ??
    raw?.ticket_code ??
    raw?.code ??
    ''
  ).toString().trim();

  return {
    id: raw?.ticket_id ?? raw?.registration_id ?? raw?.id ?? `ticket-${index}`,
    eventId: raw?.event_id ?? raw?.eventId ?? raw?.id,
    title: raw?.title ?? raw?.name ?? 'Untitled event',
    category: raw?.category ?? 'Other',
    date: raw?.event_date ?? raw?.date ?? start ?? '',
    time: raw?.time ?? fallbackTime ?? '',
    location: raw?.location ?? raw?.venue ?? 'TBA',
    fullAddress: raw?.full_address ?? raw?.fullAddress ?? raw?.location ?? 'TBA',
    registrationDate: raw?.registered_at ?? raw?.registration_date ?? raw?.created_at ?? start ?? '',
    price: raw?.price ?? 0,
    status: raw?.status ?? 'active',
    image: imageUrl,
    qrImage,
    qrTicket,
    organizer: raw?.organization_name ?? raw?.organizationName ?? raw?.organizer ?? 'Unknown organizer',
  };
};

export const MyTicketPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const response = await eventService.getRegisteredEvents();
      const rawTickets = getRegisteredEventsPayload(response);
      const normalizedTickets = rawTickets.map((item, index) => mapRawTicket(item, index));
      setTickets(normalizedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleViewEvent = (eventId) => {
    navigate(`/my-ticket/detail/${eventId}`);
  };

  const handleShowQrTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setSelectedTicket(null);
  };

  const handleCopyTicketCode = async () => {
    if (!selectedTicket?.qrTicket) {
      toast.error('No ticket code available to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedTicket.qrTicket);
      toast.success('Ticket code copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy ticket code.');
    }
  };

  const handleDownloadQr = async () => {
    if (!selectedTicket?.qrImage) {
      toast.error('No QR code available to download.');
      return;
    }

    try {
      // Sanitize filename: replace characters not allowed in filenames with underscores
      // This regex allows letters, numbers, spaces, and common punctuation, but replaces others.
      const sanitizedName = selectedTicket.title.replace(/[/\\?%*:#|"<>&.]/g, '_').trim();
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${sanitizedName}_ticket_${timestamp}.png`;
      
      if (selectedTicket.qrImage.startsWith('data:')) {
        // Handle base64 data
        const link = document.createElement('a');
        link.href = selectedTicket.qrImage;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle URL - use canvas to convert image to blob
        const qrUrl = selectedTicket.qrImage.startsWith('http') 
          ? selectedTicket.qrImage 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedTicket.qrImage}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // Fallback to simple download
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
      
      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download ticket. Please try again.');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = ticket.title.toLowerCase().includes(normalizedSearch) ||
                         (ticket.location ?? '').toLowerCase().includes(normalizedSearch) ||
                         (ticket.organizer ?? '').toLowerCase().includes(normalizedSearch);
    
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    
    const matchesDate = selectedDate === 'all' || 
                       (selectedDate === 'upcoming' && new Date(ticket.date) > new Date()) ||
                       (selectedDate === 'past' && new Date(ticket.date) <= new Date());
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const categories = ['all', ...new Set(tickets.map(ticket => ticket.category))];

  // Category style helper
  const getCategoryStyle = (category) => {
    const styles = {
      technology: 'bg-violet-100 text-violet-700 border-violet-200',
      business: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      education: 'bg-blue-100 text-blue-700 border-blue-200',
      entertainment: 'bg-pink-100 text-pink-700 border-pink-200',
      sports: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return styles[category?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Main Welcome Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 md:p-12 text-white relative overflow-hidden min-h-[280px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
                <Ticket className="w-4 h-4" />
                <span className="text-sm font-medium">My Tickets</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Your Event<br />Tickets
              </h1>
              <p className="text-blue-100 text-lg max-w-lg">
                Access all your registered events in one place. Show your QR code at the venue for quick check-in.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-wrap items-center gap-4 mt-6">
              <div className="flex items-center gap-3 px-5 py-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <div className="text-2xl font-bold">{tickets.length}</div>
                  <div className="text-sm text-blue-200">Active Tickets</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="flex flex-col gap-6">
            {/* Upcoming Events Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 flex-1">
              <div className="p-4 bg-blue-100 rounded-2xl w-fit mb-5">
                <CalendarDays className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {tickets.filter(t => new Date(t.date) > new Date()).length}
              </div>
              <p className="text-gray-500 text-lg">Upcoming Events</p>
              <p className="text-blue-600 mt-3 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Don't miss out!
              </p>
            </div>

            {/* Search Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Filter:</span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:border-blue-300 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.filter(cat => cat !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:border-blue-300 transition-all"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Events</option>
          </select>

          <button
            onClick={fetchMyTickets}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Tickets</h2>
            <p className="text-gray-500 mt-1">
              {loading ? 'Loading...' : `${filteredTickets.length} tickets found`}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                      <div className="h-4 bg-gray-100 rounded w-24" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                      <div className="h-4 bg-gray-100 rounded w-32" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <div className="h-12 bg-gray-200 rounded-xl flex-1" />
                    <div className="h-12 bg-gray-200 rounded-xl flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedDate !== 'all' 
                ? 'Try adjusting your filters.' 
                : 'Register for events to see your tickets here.'}
            </p>
            <button
              onClick={() => navigate('/all-events')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2"
            >
              Browse Events
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                {/* Event Image */}
                <div className="relative h-52 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                  <img 
                    src={ticket.image} 
                    alt={ticket.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm bg-white/90 ${getCategoryStyle(ticket.category)}`}>
                      {ticket.category}
                    </span>
                  </div>
                  
                  {/* Date badge */}
                  <div className="absolute bottom-4 left-4">
                    <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
                      <div className="text-xl font-bold text-gray-900 leading-none">{new Date(ticket.date).getDate()}</div>
                      <div className="text-xs font-semibold text-gray-500 uppercase">{new Date(ticket.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  {new Date(ticket.date) > new Date() ? (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-xl">
                      Upcoming
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-gray-500 text-white text-xs font-bold rounded-xl">
                      Past
                    </div>
                  )}
                </div>

                {/* Ticket Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {ticket.title}
                  </h3>
                  
                  <div className="space-y-3 text-sm text-gray-500 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="font-medium">{formatTime(ticket.time)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-rose-500" />
                      </div>
                      <span className="truncate font-medium">{ticket.location}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewEvent(ticket.eventId)}
                      className="flex-1 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShowQrTicket(ticket)}
                      className="flex-1 py-3.5 border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Ticket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Ticket Modal */}
      {showQrModal && selectedTicket && (
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
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedTicket.title}</h3>
                  <div className="space-y-3 text-base text-gray-700">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(selectedTicket.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{formatTime(selectedTicket.time)}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{selectedTicket.location}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section - Full width, below detail */}
                <div className="w-full bg-white border-2 border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center">
                  <div className="w-72 h-72 bg-white border-4 border-blue-100 rounded-xl p-5 mb-4 flex items-center justify-center shadow-inner">
                    {selectedTicket.qrImage ? (
                      <img
                        src={selectedTicket.qrImage.startsWith('data:') ? selectedTicket.qrImage : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedTicket.qrImage}`}
                        alt="Ticket QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDR2MW02IDExaDJtLTYgMGgtMnY0bTAtMTF2M20wMGguMDFNMTIgMTJoNC4wMU0xNiAyMGg0TTQgMTJoNG0xMiAwaC4wMU01IDhoMmExIDEgMCAwMDEtMVY1YTEgMSAwIDAwLTEtMUg1YTEgMSAwIDAwLTEgMXYyYTEgMSAwIDAwMSAxem0xMiAwaDJhMSAxIDAgMDAxLTFWNWExIDEgMCAwMC0xLTFoLTJhMSAxIDAgMDAtMSAxdjJhMSAxIDAgMDAxIDF6TTUgMjBoMmExIDEgMCAwMDEtMXYtMmExIDEgMCAwMC0xLTFINWExIDEgMCAwMC0xIDF2MmExIDEgMCAwMDEgMXoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
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
                    {selectedTicket.qrTicket || 'Ticket code unavailable'}
                  </div>
                  <button
                    onClick={handleCopyTicketCode}
                    disabled={!selectedTicket.qrTicket}
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

