import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
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
  Loader2,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

export const ManageAttendeesPage = () => {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    ? error?.response?.data?.message || error?.message || t('attendees.failedToFetchEvents')
    : null;

  const handleSelectEvent = (eventId) => {
    navigate(`/manage-attendees/${eventId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await eventsResponse?.refetch?.();
    setTimeout(() => setIsRefreshing(false), 1000);
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
    return date.toLocaleDateString(locale, {
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
        
        {/* Header Section - Enhanced Responsive Design */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Main Title Card */}
          <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="h-2 bg-blue-500" />
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform duration-300">
                  <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('attendees.manageAttendees')}</h1>
                  <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">{t('attendees.selectEventToManage')}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      Scanner Ready
                    </span>
                    {isFetching && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs sm:text-sm font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered Card - Enhanced */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 animate-pulse" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{totalRegistered.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('attendees.totalRegistered')}</p>
            <div className="mt-3 h-1.5 sm:h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Checked In Card - Enhanced */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="text-blue-600 text-xs sm:text-sm font-bold">
                {totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0}%
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{totalCheckedIn.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('attendees.checkedIn')}</p>
            <div className="mt-3 h-1.5 sm:h-2 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('attendees.searchEventsPlaceholder')}
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 rotate-45" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm sm:text-base font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('attendees.refresh')}</span>
            </button>
            
            {pagination.total > 0 && (
              <div className="px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm sm:text-base text-gray-600 font-medium">
                {t('attendees.showing')}<span className="font-semibold text-gray-900">{events.length}</span>{t('attendees.of')}<span className="font-semibold text-gray-900">{pagination.total.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="p-2 bg-red-100 rounded-lg">
              <Inbox className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-700 text-sm font-semibold mb-1">{t('attendees.unableToLoadEvents')}</p>
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
                  <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-2 bg-gray-100 rounded-full mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event, index) => {
                const checkInRate = event.total_registered > 0 
                  ? Math.round((event.total_checked_in / event.total_registered) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={event.event_id}
                    onClick={() => handleSelectEvent(event.event_id)}
                    className="group bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-in slide-in-from-bottom-4 fade-in-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 flex-1 pr-2">
                        {event.event_name}
                      </h3>
                      <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-blue-100 group-hover:rotate-45 transition-all duration-300 flex-shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">{formatDate(event.event_date_time)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Enhanced Check-in Progress */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">{t('attendees.checkInProgress')}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs sm:text-sm font-bold ${
                            checkInRate >= 80 ? 'text-blue-600' : 
                            checkInRate >= 50 ? 'text-blue-600' : 'text-blue-600'
                          }`}>
                            {checkInRate}%
                          </span>
                          {checkInRate >= 80 && (
                            <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out bg-blue-500"
                          style={{ width: `${checkInRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-gray-600">
                            <span className="font-semibold text-gray-900">{event.total_registered}</span>{t('attendees.registeredSuffix')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          <span className="text-gray-600">
                            <span className="font-semibold text-blue-600">{event.total_checked_in}</span>{t('attendees.checkedInSuffix')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  {t('attendees.page')}<span className="font-semibold text-gray-900">{currentPage}</span>{t('attendees.of')}<span className="font-semibold text-gray-900">{pagination.total_pages}</span>
                </div>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 sm:p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {/* Show smart pagination */}
                    {(() => {
                      const pages = [];
                      const totalPages = pagination.total_pages;
                      const current = currentPage;
                      
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        pages.push(1);
                        if (current > 3) pages.push('ellipsis-start');
                        
                        const start = Math.max(2, current - 1);
                        const end = Math.min(totalPages - 1, current + 1);
                        
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }
                        
                        if (current < totalPages - 2) pages.push('ellipsis-end');
                        pages.push(totalPages);
                      }
                      
                      return pages.map((page, index) => {
                        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                          return (
                            <span key={page} className="w-8 h-8 flex items-center justify-center text-gray-400">
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              current === page
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                    className="p-2.5 sm:p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-16 text-center border border-gray-200 animate-in fade-in-50 duration-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Inbox className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              {searchQuery ? t('attendees.noMatchingEvents') : t('attendees.noEventsWithAttendees')}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto mb-6">
              {searchQuery 
                ? t('attendees.adjustSearchTerms')
                : t('attendees.eventsWillAppear')
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base inline-flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

