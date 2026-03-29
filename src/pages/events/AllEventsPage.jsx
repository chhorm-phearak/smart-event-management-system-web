import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eventService } from '@/services';

const formatEventDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const formatEventTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const AllEventsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedQRCode, setSelectedQRCode] = useState(null);

  // Mock categories - replace with actual categories from API
  const categories = ['All Category', 'Technology', 'Business', 'Education', 'Entertainment', 'Sports'];

  // Mock date filters
  const dateFilters = ['All Date', 'Today', 'This Week', 'This Month', 'Upcoming'];

  const {
    data: rawEvents = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['events', { category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchQuery || undefined }],
    queryFn: async () => {
      const res = await eventService.getAllEvents({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      });
      return res?.data?.events ?? res?.events ?? [];
    },
  });

  const events = useMemo(() => {
    const mapped = rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: formatEventDate(e.start_time),
      time: formatEventTime(e.start_time),
      location: e.location || e.full_address || '—',
      maxAttendees: e.capacity ?? 0,
      category: e.category || 'Other',
      image: e.images?.[0]?.image_url || 'https://via.placeholder.com/400x200?text=Event',
      qrcode: (e.qr_image_url || e.qrcode) ?? e.qr_code ?? '',
      start_time: e.start_time,
    }));

    let filtered = mapped;
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((event) =>
        event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (selectedDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_time);
        if (selectedDate === 'today') {
          return eventDate.toDateString() === now.toDateString();
        }
        if (selectedDate === 'this week') {
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return eventDate >= now && eventDate <= weekEnd;
        }
        if (selectedDate === 'this month') {
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
        }
        if (selectedDate === 'upcoming') return eventDate >= now;
        return true;
      });
    }
    return filtered;
  }, [rawEvents, searchQuery, selectedCategory, selectedDate]);

  const handleDownloadQr = async (qrCode, title) => {
    if (!qrCode) {
      toast.error('No QR code available to download.');
      return;
    }

    try {
      // Set filename based on event title and current date
      const sanitizedName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code. Please try again.');
    }
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ALL Events</h1>
      </div>

      {/* Browse Events Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Section Header with Create Event Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse Events</h2>
          <button
            onClick={() => navigate('/create-event')}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Event
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1 min-w-[250px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            >
              {categories.map((category) => (
                <option key={category} value={category === 'All Category' ? 'all' : category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            >
              {dateFilters.map((filter) => (
                <option key={filter} value={filter === 'All Date' ? 'all' : filter.toLowerCase()}>
                  {filter}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Failed to load events. Please try again.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                {/* Event Image */}
                <div className="w-full h-48 bg-gradient-to-br from-orange-200 to-orange-300 relative overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>

                  {/* Event Info */}
                  <div className="space-y-3 mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">{event.date}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">{event.time}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      <span className="text-sm truncate">{event.location}</span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span className="text-sm">Max {event.maxAttendees} attendee</span>
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                    className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Register Now</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                </div>

                {/* QR Code - Outside the clickable div */}
                {event.qrcode && (
                  <div className="px-4 pb-4">
                    <div 
                      className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors p-2 rounded hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQRCode({
                          title: event.title,
                          qrcode: event.qrcode
                        });
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      <span className="text-sm">QR Available</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQRCode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQRCode(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedQRCode.title}</h3>
              <button
                onClick={() => setSelectedQRCode(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center mb-4">
              <img
                src={selectedQRCode.qrcode.startsWith('data:') ? selectedQRCode.qrcode : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedQRCode.qrcode}`}
                alt="QR Code"
                className="w-64 h-64 object-contain"
                onLoad={() => {
                  console.log('QR Code image loaded successfully in AllEventsPage');
                }}
                onError={(e) => {
                  console.error('QR Code image failed to load in AllEventsPage:', e);
                  console.error('QR Code data type:', typeof selectedQRCode.qrcode);
                  console.error('QR Code data length:', selectedQRCode.qrcode?.length);
                  console.error('QR Code data starts with:', selectedQRCode.qrcode?.substring(0, 50));
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDR2MW02IDExaDJtLTYgMGgtMnY0bTAtMTF2M20wMGguMDFNMTIgMTJoNC4wMU0xNiAyMGg0TTQgMTJoNG0xMiAwaC4wMU01IDhoMmExIDEgMCAwMDEtMVY1YTEgMSAwIDAwLTEtMUg1YTEgMSAwIDAwLTEgMXYyYTEgMSAwIDAwMSAxem0xMiAwaDJhMSAxIDAgMDAxLTFWNWExIDEgMCAwMC0xLTFoLTJhMSAxIDAgMDAtMSAxdjJhMSAxIDAgMDAxIDF6TTUgMjBoMmExIDEgMCAwMDEtMXYtMmExIDEgMCAwMC0xLTFINWExIDEgMCAwMC0xIDF2MmExIDEgMCAwMTEgMXoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                }}
              />
            </div>
            
            <p className="text-center text-sm text-gray-600 mb-4">
              Scan this QR code to register for the event
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedQRCode(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadQr(selectedQRCode.qrcode, selectedQRCode.title)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
