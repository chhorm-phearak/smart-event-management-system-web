import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '@/services';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit3,
  UserPlus,
  MoreVertical,
  X,
  CalendarDays,
  TrendingUp,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const ManageEventsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getManagedEvents();
      const apiEvents = response?.data?.events || [];
      
      const now = new Date();
      
      // Transform API data to match component structure
      let transformedEvents = apiEvents.map(event => {
        const startTime = new Date(event.start_time);
        const status = startTime >= now ? 'upcoming' : 'past';
        return {
          id: event.id,
          title: event.title,
          startTime: startTime,
          registeredDate: startTime.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
          location: event.location,
          totalCapacity: event.capacity,
          registered: event.registered_count || 0,
          status: status,
          image: event.primary_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
          shortDescription: event.short_description,
          category: event.category,
          staffCount: event.staff_count || 0,
          organizationName: event.organization_name,
          groupName: event.group_name,
        };
      });

      // Filter events based on start_time
      if (filter === 'upcoming') {
        transformedEvents = transformedEvents.filter(e => e.startTime >= now);
      } else if (filter === 'past') {
        transformedEvents = transformedEvents.filter(e => e.startTime < now);
      }

      // Apply search filter
      if (searchTerm) {
        transformedEvents = transformedEvents.filter(event =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageStaff = (eventId) => {
    navigate(`/manage-events/${eventId}/staff`);
  };

  const handleEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleCancel = async (eventId) => {
    if (window.confirm('Are you sure you want to cancel this event?')) {
      try {
        await eventService.cancelEvent(eventId);
        fetchEvents();
      } catch (error) {
        console.error('Error cancelling event:', error);
      }
    }
  };

  const calculateProgress = (registered, total) => {
    return total > 0 ? Math.round((registered / total) * 100) : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'past':
        return 'Past';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Main Hero Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-10 md:p-12 text-white relative overflow-hidden min-h-[280px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Event Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Manage Your<br />Events
              </h1>
              <p className="text-blue-100 text-lg max-w-lg">
                Create, edit, and manage all your organization's events in one place
              </p>
            </div>
            
            <div className="relative z-10 mt-6">
              <button
                onClick={() => navigate('/create-event')}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-5 h-5" />
                Create New Event
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-col gap-6">
            {/* Total Events */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 flex-1 hover:shadow-lg transition-all">
              <div className="p-4 bg-blue-100 rounded-2xl w-fit mb-5">
                <CalendarDays className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{events.length}</div>
              <p className="text-gray-500 text-lg">Total Events</p>
            </div>

            {/* Upcoming Events */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white flex-1">
              <div className="p-4 bg-white/20 rounded-2xl w-fit mb-5">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="text-4xl font-bold mb-2">{events.filter(e => e.status === 'upcoming').length}</div>
              <p className="text-emerald-100 text-lg">Upcoming Events</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              filter === 'past'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            Past
          </button>

          {/* Search */}
          <div className="flex-1 min-w-[250px] relative ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchEvents();
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                    <div className="flex gap-3">
                      <div className="h-10 bg-gray-200 rounded-lg w-32" />
                      <div className="h-10 bg-gray-200 rounded-lg w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {filter !== 'all' ? `No ${filter} events available` : 'Create your first event to get started'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/create-event')}
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-5 h-5" />
                Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {events.map((event) => (
              <div
                key={event.id}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Event Image with Overlay */}
                  <div className="relative w-full lg:w-80 h-56 lg:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent lg:bg-gradient-to-t lg:from-black/50 lg:to-transparent" />
                    
                    {/* Status on Image */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg ${
                        event.status === 'upcoming' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>

                    {/* Category on Image */}
                    {event.category && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-bold rounded-lg shadow-lg">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {/* Date Badge on Image */}
                    <div className="absolute bottom-4 left-4 lg:hidden">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">{event.registeredDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 p-6 lg:p-8">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        {event.organizationName && (
                          <p className="text-sm text-gray-500">by {event.organizationName}</p>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-medium">Date</p>
                          <p className="text-sm font-semibold text-gray-900">{event.registeredDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 uppercase font-medium">Location</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-medium">Capacity</p>
                          <p className="text-sm font-semibold text-gray-900">{event.registered}/{event.totalCapacity}</p>
                        </div>
                      </div>
                      {event.staffCount > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-medium">Staff</p>
                            <p className="text-sm font-semibold text-gray-900">{event.staffCount} members</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Section */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">Registration Progress</span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            calculateProgress(event.registered, event.totalCapacity) >= 80
                              ? 'bg-emerald-100 text-emerald-700'
                              : calculateProgress(event.registered, event.totalCapacity) >= 50
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {calculateProgress(event.registered, event.totalCapacity) >= 80 ? 'Almost Full' : 
                             calculateProgress(event.registered, event.totalCapacity) >= 50 ? 'Filling Up' : 'Open'}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {calculateProgress(event.registered, event.totalCapacity)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            calculateProgress(event.registered, event.totalCapacity) >= 80
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${calculateProgress(event.registered, event.totalCapacity)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => navigate(`/events/${event.id}`, { state: { fromManageEvents: true } })}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleManageStaff(event.id)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Staff
                      </button>
                      <button
                        onClick={() => handleEdit(event.id)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Event
                      </button>

                      {/* More actions dropdown */}
                      <div className="relative ml-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === event.id ? null : event.id);
                          }}
                          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openDropdownId === event.id && (
                          <div
                            className="absolute right-0 top-full mt-2 py-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleCancel(event.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                            >
                              <X className="w-4 h-4" />
                              Cancel Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
