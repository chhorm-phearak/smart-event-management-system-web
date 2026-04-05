import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendeeService } from '@/services';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  QrCode,
  ClipboardList,
  TrendingUp,
  Inbox,
} from 'lucide-react';

export const ManageAttendeesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 6;

  const {
    data: eventsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['attendee-events-stats', currentPage, searchQuery],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      return attendeeService.getMyEventsStats(params);
    },
    keepPreviousData: true,
  });

  const events = eventsResponse?.data?.events ?? [];
  const pagination = eventsResponse?.data?.pagination ?? {
    page: currentPage,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
  };
  const errorMessage = isError
    ? error?.response?.data?.message || error?.message || 'Failed to fetch events'
    : null;

  const handleSelectEvent = (eventId) => {
    navigate(`/manage-attendees/${eventId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.total_pages || 1)) {
      return;
    }
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInitialLoading = isLoading && !eventsResponse;

  // Calculate stats
  const totalRegistered = events.reduce((sum, e) => sum + (e.total_registered || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e.total_checked_in || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        
        {/* Header Section - Split Card Design */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Main Title Card with Gradient Accent */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/25">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Manage Attendees</h1>
                  <p className="text-gray-500">Select an event to manage check-ins and scan QR codes</p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                      Scanner Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalRegistered}</p>
            <p className="text-gray-500 font-medium">Total Registered</p>
            <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Checked In Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-emerald-200 text-sm font-medium">
                {totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0}%
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{totalCheckedIn}</p>
            <p className="text-emerald-100 font-medium">Checked In</p>
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full transition-all duration-500" 
                style={{ width: `${totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {pagination.total > 0 && (
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{events.length}</span> of <span className="font-semibold text-gray-900">{pagination.total}</span> events
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Events Grid */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-12 bg-gray-100 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const checkInRate = event.total_registered > 0 
                  ? Math.round((event.total_checked_in / event.total_registered) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={event.event_id}
                    onClick={() => handleSelectEvent(event.event_id)}
                    className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer"
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1 pr-2">
                        {event.event_name}
                      </h3>
                      <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-blue-100 transition-colors flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{formatDate(event.event_date_time)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="text-sm text-gray-600 font-medium truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Check-in Progress */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Check-in Progress</span>
                        <span className={`text-sm font-bold ${checkInRate >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {checkInRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            checkInRate >= 80
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                              : 'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`}
                          style={{ width: `${checkInRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600"><span className="font-semibold text-gray-900">{event.total_registered}</span> registered</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-600"><span className="font-semibold text-emerald-600">{event.total_checked_in}</span> checked in</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.total_pages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages}
                  className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search query' : 'You have no events with attendees yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

