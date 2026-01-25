import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '@/services';

export const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('events');
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupDetails();
    fetchGroupEvents();
    fetchGroupMembers();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      // const data = await groupService.getGroupById(id);
      
      const mockGroup = {
        id: id || 1,
        name: 'Web Development',
        description: 'A group full of web developers passionate about building amazing web applications. Join us to share knowledge, collaborate on projects, and stay updated with the latest web technologies.',
        members: 100,
        events: 12,
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=400&fit=crop',
        createdDate: '2024-01-15',
        isJoined: true,
      };
      
      setGroup(mockGroup);
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupEvents = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      // const data = await eventService.getEventsByGroupId(id);
      
      const mockEvents = [
        {
          id: 1,
          title: 'React Workshop 2025',
          date: 'Aug 30, 2025',
          time: '09:00 AM',
          location: 'Khan 7 Makara, Phnom Penh',
          maxAttendees: 100,
          registered: 75,
          category: 'Technology',
          image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
        },
        {
          id: 2,
          title: 'Next.js Deep Dive',
          date: 'Sep 5, 2025',
          time: '10:00 AM',
          location: 'Khan Daun Penh, Phnom Penh',
          maxAttendees: 80,
          registered: 60,
          category: 'Technology',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
        },
        {
          id: 3,
          title: 'Web Performance Optimization',
          date: 'Sep 15, 2025',
          time: '02:00 PM',
          location: 'Khan Chamkar Mon, Phnom Penh',
          maxAttendees: 150,
          registered: 120,
          category: 'Technology',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
        },
        {
          id: 4,
          title: 'TypeScript Best Practices',
          date: 'Sep 20, 2025',
          time: '09:00 AM',
          location: 'Khan Toul Kork, Phnom Penh',
          maxAttendees: 60,
          registered: 45,
          category: 'Technology',
          image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=200&fit=crop',
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching group events:', error);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      // const data = await groupService.getGroupMembers(id);
      
      const mockMembers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          joinedDate: '2024-01-15',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
          joinedDate: '2024-01-20',
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          joinedDate: '2024-02-01',
        },
        {
          id: 4,
          name: 'Sarah Williams',
          email: 'sarah.williams@example.com',
          role: 'Moderator',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
          joinedDate: '2024-02-10',
        },
        {
          id: 5,
          name: 'David Brown',
          email: 'david.brown@example.com',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
          joinedDate: '2024-02-15',
        },
        {
          id: 6,
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
          joinedDate: '2024-02-20',
        },
      ];
      
      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`, { state: { fromGroup: id } });
  };

  const handleCreateEvent = () => {
    navigate(`/create-event?groupId=${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Group not found</p>
        <button
          onClick={() => navigate('/group')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/group')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to Groups</span>
      </button>

      {/* Group Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Group Image */}
        <div className="h-64 bg-gray-200">
          <img 
            src={group.image} 
            alt={group.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Group Info */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              <p className="text-gray-600 mb-4">{group.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium text-gray-700">{group.members} Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-700">{group.events} Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-700">Created {formatDate(group.createdDate)}</span>
                </div>
              </div>
            </div>

            {/* Create Event Button */}
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'events'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'members'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Members ({members.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">No events yet</p>
                  <p className="text-gray-400 text-sm mb-4">Be the first to create an event for this group!</p>
                  <button
                    onClick={handleCreateEvent}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Event</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Event Image */}
                      <div className="h-48 bg-gray-200">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Event Content */}
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {event.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>

                        {/* Attendance Progress */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Attendance</span>
                            <span>{event.registered} / {event.maxAttendees}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round((event.registered / event.maxAttendees) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No members yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="shrink-0">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-gray-900 truncate">{member.name}</h4>
                          {member.role === 'Admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Admin
                            </span>
                          )}
                          {member.role === 'Moderator' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Moderator
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Joined {formatDate(member.joinedDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
