import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ManageAttendeesPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockEvents = [
        {
          id: 1,
          title: 'Tech Conference 2024',
          registeredDate: '2/10/2024',
          location: 'Convention Center, New York',
          totalAttendees: 30,
          checkedInAttendees: 20,
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
          status: 'active'
        },
        {
          id: 2,
          title: 'AI & Machine Learning Summit',
          registeredDate: '3/15/2024',
          location: 'Tech Hub, San Francisco',
          totalAttendees: 45,
          checkedInAttendees: 32,
          image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
          status: 'active'
        },
        {
          id: 3,
          title: 'Web Development Workshop',
          registeredDate: '4/20/2024',
          location: 'Online',
          totalAttendees: 25,
          checkedInAttendees: 18,
          image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
          status: 'active'
        },
        {
          id: 4,
          title: 'Startup Networking Night',
          registeredDate: '5/10/2024',
          location: 'Business Center, Boston',
          totalAttendees: 60,
          checkedInAttendees: 55,
          image: 'https://images.unsplash.com/photo-1515189828136-35d2523c5b06?w=400&h=200&fit=crop',
          status: 'completed'
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventId) => {
    navigate(`/manage-attendees/${eventId}`);
  };

  const calculateCheckInPercentage = (total, checkedIn) => {
    return Math.round((checkedIn / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Attendees</h1>
            <p className="text-gray-600 mt-1">Select an event to manage attendees and scan QR codes</p>
          </div>
        </div>
      </div>

      {/* Select an Event Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Select an Event</h2>
        
        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id}
              onClick={() => handleSelectEvent(event.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                {/* Registration Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Registered on {event.registeredDate}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>

                {/* Attendee Statistics */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{event.totalAttendees} total</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">{event.checkedInAttendees} checked in</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

