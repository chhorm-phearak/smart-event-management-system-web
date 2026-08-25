import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eventService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  QrCode,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Rocket,
  Target,
  Globe,
  Heart,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';

// Custom hook for debounced value
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// Format utilities are defined inside the component so they can use the selected locale.

// Category styles
const CATEGORY_STYLES = {
  technology: 'bg-violet-100 text-violet-700 border-violet-200',
  business: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  education: 'bg-blue-100 text-blue-700 border-blue-200',
  entertainment: 'bg-pink-100 text-pink-700 border-pink-200',
  sports: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const getCategoryStyle = (category) => CATEGORY_STYLES[category?.toLowerCase()] || CATEGORY_STYLES.other;

// Clean Event Card - Larger Size
const EventCard = ({ event, onNavigate, onShowQR }) => {
  const { t, locale } = useLanguage();
  const categoryStyle = getCategoryStyle(event.category);
  const categoryLabel = t('events.allEvents.categories.' + (event.category?.toLowerCase() || 'other'));

  return (
    <div 
      className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => onNavigate(event.id)}
    >
      {/* Image - Larger */}
      <div className="relative h-52 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm bg-white/90 ${categoryStyle}`}>
            {categoryLabel}
          </span>
        </div>
        
        {/* QR button on hover */}
        {event.qrcode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onShowQR(event); }}
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white"
          >
            <QrCode className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {/* Date badge on image */}
        <div className="absolute bottom-4 left-4">
          <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="text-xl font-bold text-gray-900 leading-none">{new Date(event.start_time).getDate()}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase">{new Date(event.start_time).toLocaleDateString(locale, { month: 'short' })}</div>
          </div>
        </div>
      </div>
      
      {/* Content - More padding */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {event.title}
        </h3>
        
        <div className="space-y-3 text-sm text-gray-500 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-medium">{event.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-lg">
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
            <span className="truncate font-medium">{event.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-medium">{t('common.attendees', { count: event.maxAttendees })}</span>
          </div>
        </div>
        
        <button 
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          onClick={(e) => { e.stopPropagation(); onNavigate(event.id); }}
        >
          {t('events.allEvents.viewDetails')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Skeleton - Larger
const EventCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 animate-pulse">
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="h-12 bg-gray-200 rounded-xl w-full mt-2" />
    </div>
  </div>
);

// QR Modal
const QRCodeModal = ({ selectedQRCode, onClose, onDownload }) => {
  const { t } = useLanguage();
  if (!selectedQRCode) return null;
  const qrSrc = selectedQRCode.qrcode.startsWith('data:')
    ? selectedQRCode.qrcode
    : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedQRCode.qrcode}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedQRCode.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('events.allEvents.scanQr')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-6 flex justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <img src={qrSrc} alt="QR Code" className="w-48 h-48 object-contain" onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48L3N2Zz4='; }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">{t('common.close')}</button>
          <button onClick={() => onDownload(selectedQRCode.qrcode, selectedQRCode.title)} className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
            <Download className="w-4 h-4" /> {t('common.download')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Pill
const CategoryPill = ({ category, active, onClick }) => {
  const { t } = useLanguage();
  const label = t('events.allEvents.categories.' + (category?.toLowerCase() || 'other'));
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );
};

// Constants
const CATEGORIES = ['All', 'Technology', 'Business', 'Education', 'Entertainment', 'Sports'];
const DATE_FILTERS = ['All', 'Today', 'This Week', 'This Month', 'Upcoming'];
const ITEMS_PER_PAGE = 12;

// Organization Required Modal
const OrganizationRequiredModal = ({ isOpen, onClose, onRegister }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('events.allEvents.organizationRequired')}</h3>
          <p className="text-gray-500 mb-8">
            {t('events.allEvents.organizationRequiredSub')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onRegister}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
            >
              {t('header.registerOrganization')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AllEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isOrganizer = !!(user?.organization_id ?? user?.organizationId ?? user?.organization?.id);
  const formatEventDate = useCallback((isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' });
  }, [locale]);
  const formatEventTime = useCallback((isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [locale]);
  const dateFilterLabels = {
    All: t('events.allEvents.dateFilters.anyTime'),
    Today: t('events.allEvents.dateFilters.today'),
    'This Week': t('events.allEvents.dateFilters.thisWeek'),
    'This Month': t('events.allEvents.dateFilters.thisMonth'),
    Upcoming: t('events.allEvents.dateFilters.upcoming'),
  };
  const [showOrgRequiredModal, setShowOrgRequiredModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedDate]);

  const {
    data: rawEvents = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events', { category: selectedCategory !== 'all' ? selectedCategory : undefined, search: debouncedSearch || undefined }],
    queryFn: async () => {
      const res = await eventService.getAllEvents({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: debouncedSearch || undefined,
      });
      return res?.data?.events ?? res?.events ?? [];
    },
  });

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedDate !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDate('all');
    setCurrentPage(1);
  }, []);

  const handleNavigate = useCallback((eventId) => {
    navigate(`/events/${eventId}`);
  }, [navigate]);

  const handleShowQR = useCallback((event) => {
    setSelectedQRCode({ title: event.title, qrcode: event.qrcode });
  }, []);

  const { events, totalPages, totalCount } = useMemo(() => {
    const mapped = rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: formatEventDate(e.start_time),
      time: formatEventTime(e.start_time),
      location: e.location || e.full_address || '—',
      maxAttendees: e.capacity ?? 0,
      category: e.category || 'Other',
      image: e.images?.[0]?.image_url || '',
      qrcode: (e.qr_image_url || e.qrcode) ?? e.qr_code ?? '',
      start_time: e.start_time,
    }));

    let filtered = mapped;

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.category.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((event) =>
        event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedDate !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_time);
        switch (selectedDate) {
          case 'today': return eventDate.toDateString() === now.toDateString();
          case 'this week': {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= now && eventDate <= weekEnd;
          }
          case 'this month': return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
          case 'upcoming': return eventDate >= now;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedEvents = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { events: paginatedEvents, totalPages, totalCount };
  }, [rawEvents, debouncedSearch, selectedCategory, selectedDate, currentPage, formatEventDate, formatEventTime]);

  const handleDownloadQr = async (qrCode, title) => {
    if (!qrCode) {
      toast.error(t('events.allEvents.noQr'));
      return;
    }

    try {
      // Set filename based on event title and current date
      // Sanitize filename while preserving Unicode characters (including Khmer)
      const sanitizedName = title
        .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid filename characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length to avoid issues
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${sanitizedName}_qr_${timestamp}.png`;
      
      if (qrCode.startsWith('data:')) {
        // Handle base64 data
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle URL - use canvas to convert image to blob (bypasses CORS for download)
        const qrUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${qrCode}`;
        
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
      
      toast.success(t('events.allEvents.qrDownloaded'));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('events.allEvents.qrDownloadFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Main Welcome Card - Takes 2 columns */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 md:p-12 text-white relative overflow-hidden min-h-[320px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">{t('events.allEvents.discoverEvents')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {t('events.allEvents.findAmazing')}<br />{t('events.allEvents.eventsNearYou')}
              </h1>
              <p className="text-blue-100 text-lg mb-8 max-w-lg">
                {t('events.allEvents.subtitle')}
              </p>
            </div>
            
            <div className="relative z-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => isOrganizer ? navigate('/create-event') : setShowOrgRequiredModal(true)}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-5 h-5" />
                {t('events.allEvents.createEvent')}
              </button>
              <div className="flex items-center gap-3 text-white/80">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white/30" />
                  <div className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-white/30" />
                  <div className="w-10 h-10 rounded-full bg-purple-400 border-2 border-white/30" />
                </div>
                <span className="text-sm">{t('events.allEvents.joinEvents', { count: totalCount })}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Action */}
          <div className="flex flex-col gap-6">
            {/* Stats Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 flex-1">
              <div className="p-4 bg-emerald-100 rounded-2xl w-fit mb-5">
                <TrendingUp className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2">1000+</div>
              <p className="text-gray-500 text-lg">{t('events.allEvents.eventsHosted')}</p>
              <p className="text-emerald-600 mt-3 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {t('events.allEvents.andGrowing')}
              </p>
            </div>

            {/* Quick Action Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white flex-1">
              <div className="p-4 bg-white/20 rounded-2xl w-fit mb-5">
                <Rocket className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('events.allEvents.getStarted')}</h3>
              <p className="text-blue-100 mb-4">{t('events.allEvents.getStartedSub')}</p>
              <button className="flex items-center gap-2 font-semibold hover:gap-3 transition-all">
                <span>{t('events.allEvents.exploreNow')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Info Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-violet-200 hover:shadow-lg transition-all">
            <div className="p-3 bg-violet-100 rounded-xl w-fit mb-4">
              <Target className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{t('events.allEvents.findYourInterest')}</h3>
            <p className="text-gray-500">{t('events.allEvents.findYourInterestSub')}</p>
          </div>

          {/* Info Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-rose-200 hover:shadow-lg transition-all">
            <div className="p-3 bg-rose-100 rounded-xl w-fit mb-4">
              <Globe className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{t('events.allEvents.connectGlobally')}</h3>
            <p className="text-gray-500">{t('events.allEvents.connectGloballySub')}</p>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('events.allEvents.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-3">{t('events.allEvents.searchHint')}</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{t('events.allEvents.filterBy')}</span>
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                category={cat}
                active={selectedCategory === (cat === 'All' ? 'all' : cat.toLowerCase())}
                onClick={() => setSelectedCategory(cat === 'All' ? 'all' : cat.toLowerCase())}
              />
            ))}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-300 transition-all"
            >
              {DATE_FILTERS.map((filter) => (
                <option key={filter} value={filter === 'All' ? 'all' : filter.toLowerCase()}>
                  {dateFilterLabels[filter]}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition-all flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                {t('events.allEvents.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {hasActiveFilters ? t('events.allEvents.searchResults') : t('events.allEvents.allEvents')}
            </h2>
            <p className="text-gray-500 mt-1">
              {loading ? t('events.allEvents.loading') : t('events.allEvents.eventsFound', { count: totalCount })}
            </p>
          </div>
        </div>

        {/* Events Grid */}
        {error ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('events.allEvents.failedToLoad')}</h3>
            <p className="text-gray-500 mb-6">{t('events.allEvents.errorSub')}</p>
            <button onClick={() => refetch()} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
              {t('common.tryAgain')}
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('events.allEvents.noEventsFound')}</h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters ? t('events.allEvents.adjustFilters') : t('events.allEvents.beFirst')}
            </p>
            <button
              onClick={hasActiveFilters ? clearFilters : () => isOrganizer ? navigate('/create-event') : setShowOrgRequiredModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2"
            >
              {hasActiveFilters ? t('events.allEvents.clearFilters') : <><Plus className="w-5 h-5" /> {t('events.allEvents.createEvent')}</>}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onNavigate={handleNavigate}
                  onShowQR={handleShowQR}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) page = i + 1;
                      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                      else page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        selectedQRCode={selectedQRCode}
        onClose={() => setSelectedQRCode(null)}
        onDownload={handleDownloadQr}
      />

      {/* Organization Required Modal */}
      <OrganizationRequiredModal
        isOpen={showOrgRequiredModal}
        onClose={() => setShowOrgRequiredModal(false)}
        onRegister={() => {
          setShowOrgRequiredModal(false);
          navigate('/organization/register');
        }}
      />
    </div>
  );
};
