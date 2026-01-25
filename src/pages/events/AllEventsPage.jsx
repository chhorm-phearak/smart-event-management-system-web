import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '@/services';

export const AllEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  // Mock categories - replace with actual categories from API
  const categories = ['All Category', 'Technology', 'Business', 'Education', 'Entertainment', 'Sports'];

  // Mock date filters
  const dateFilters = ['All Date', 'Today', 'This Week', 'This Month', 'Upcoming'];

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedDate, searchQuery]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // For now, using mock data. Replace with actual API call when backend is ready
      // const data = await eventService.getAllEvents({
      //   category: selectedCategory !== 'all' ? selectedCategory : undefined,
      //   date: selectedDate !== 'all' ? selectedDate : undefined,
      //   search: searchQuery || undefined,
      // });
      
      // Mock data for demonstration
      const mockEvents = [
        {
          id: 1,
          title: 'Web Development',
          date: 'Aug 30, 2025',
          time: '09:00 AM',
          location: 'Khan 7 Makara, Phnom Penh',
          maxAttendees: 100,
          category: 'Technology',
          image: 'https://via.placeholder.com/400x200?text=Web+Development',
        },
        {
          id: 2,
          title: 'Mobile App Development',
          date: 'Sep 5, 2025',
          time: '10:00 AM',
          location: 'Khan Daun Penh, Phnom Penh',
          maxAttendees: 80,
          category: 'Technology',
          image: 'https://via.placeholder.com/400x200?text=Mobile+App',
        },
        {
          id: 3,
          title: 'Business Networking',
          date: 'Sep 10, 2025',
          time: '02:00 PM',
          location: 'Khan Chamkar Mon, Phnom Penh',
          maxAttendees: 150,
          category: 'Business',
          image: 'https://via.placeholder.com/400x200?text=Business',
        },
        {
          id: 4,
          title: 'Data Science Workshop',
          date: 'Sep 15, 2025',
          time: '09:00 AM',
          location: 'Khan Toul Kork, Phnom Penh',
          maxAttendees: 60,
          category: 'Technology',
          image: 'https://via.placeholder.com/400x200?text=Data+Science',
        },
        {
          id: 5,
          title: 'Digital Marketing Summit',
          date: 'Sep 20, 2025',
          time: '11:00 AM',
          location: 'Khan Sen Sok, Phnom Penh',
          maxAttendees: 200,
          category: 'Business',
          image: 'https://via.placeholder.com/400x200?text=Marketing',
        },
        {
          id: 6,
          title: 'AI & Machine Learning',
          date: 'Sep 25, 2025',
          time: '01:00 PM',
          location: 'Khan 7 Makara, Phnom Penh',
          maxAttendees: 120,
          category: 'Technology',
          image: 'https://via.placeholder.com/400x200?text=AI+ML',
        },
      ];

      // Filter events based on search, category, and date
      let filteredEvents = mockEvents;
      
      if (searchQuery) {
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedCategory !== 'all') {
        filteredEvents = filteredEvents.filter(event =>
          event.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
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
        {loading ? (
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
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event.id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
