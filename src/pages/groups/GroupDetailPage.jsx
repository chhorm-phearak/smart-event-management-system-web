import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService, eventService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';


const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${window.location.origin}${url}`;
  return url;
};

const getMemberInitial = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

const MemberAvatar = ({ name, profileImage, className = 'w-12 h-12' }) => {
  const [imgError, setImgError] = useState(false);
  const showImage = profileImage && !imgError;

  if (showImage) {
    return (
      <img
        src={profileImage}
        alt={name}
        className={`${className} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg shrink-0`}
      aria-hidden
    >
      {getMemberInitial(name)}
    </div>
  );
};

export const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('events');
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, locale } = useLanguage();


  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchGroupDetails(),
        fetchGroupEvents(),
        fetchGroupMembers()
      ]);
      setLoading(false);
    };
    
    loadAllData();
  }, [id]);

  const organizationId = user?.organization_id ?? user?.organizationId ?? user?.organization?.id ?? null;
  // Same rule as DashboardLayout: only users linked to an organization can manage/create groups
  const isOrganizer = !!organizationId;

  const fetchGroupDetails = async () => {
    try {
      // Use real API call to get group details
      const response = await groupService.getGroupDetail(id);
      console.log('Group Detail API Response:', response); // Debug log
      
      // Extract group data from API response structure
      const groupData = response?.data?.group || response?.data?.group || response?.group || {};
      
      // Normalize data for UI consumption
      // Handle image URL - API returns full URL, so use it directly
      let imageUrl = groupData.image_url || groupData.image || 'https://images.unsplash.com/photo-1526379095085-dccba630e2f6?w=1200&h=400&fit=crop';
      
      const normalizedGroup = {
        id: groupData.id || id,
        name: groupData.name || t('groups.unknownGroup'),
        description: groupData.description || t('groups.noDescription'),
        members: groupData.member_count || 0,
        events: groupData.event_count || 0,
        image: imageUrl,
        createdDate: groupData.created_at || new Date().toISOString(),
        isJoined: true, // You might want to determine this from API
      };
      
      console.log('Normalized Group:', normalizedGroup); // Debug log
      setGroup(normalizedGroup);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setLoading(false);
    }
  };

  const fetchGroupEvents = async () => {
    try {
      // Use real API call to get group events
      const response = await groupService.getGroupDetail(id);
      console.log('Events API Response:', response); // Debug log
      
      // Extract events data from API response structure
      const eventsData = response?.data?.events || response?.data?.events || [];
      console.log('Raw Events Data:', eventsData); // Debug log
      
      // Normalize events data for UI consumption
      const normalizedEvents = eventsData.map(event => {
        // Handle image parsing with robust logic (similar to EventDetailPage)
        console.log('Processing event:', event.title, 'Images:', event.images);
        const images = event.images ?? event.event_images ?? [];
        const firstImage = Array.isArray(images) ? images[0] : images;
        console.log('First image:', firstImage);
        const imageUrl =
          (firstImage && typeof firstImage === 'object' && (firstImage.image_url ?? firstImage.url)) ||
          (typeof firstImage === 'string' ? firstImage : null) ||
          'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop';
        console.log('Final image URL:', imageUrl);
        
        return {
          id: event.id,
          title: event.title || t('groups.untitledEvent'),
          date: new Date(event.start_time).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
          time: new Date(event.start_time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          location: event.location || t('groups.locationTbd'),
          maxAttendees: event.capacity || 0,
          registered: event.number_of_registered || event.registered || event.attendees_count || 0, // Handle various possible field names
          category: event.category || 'general',
          image: imageUrl,
          shortDescription: event.short_description || '',
          longDescription: event.long_description || '',
          startTime: event.start_time,
          endTime: event.end_time,
          fullAddress: event.full_address || '',
        };
      });
      
      console.log('Normalized Events:', normalizedEvents); // Debug log
      setEvents(normalizedEvents);
    } catch (error) {
      console.error('Error fetching group events:', error);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      // Use real API call to get group members
      const response = await groupService.getGroupDetail(id);
      console.log('Members API Response:', response); // Debug log
      
      // Extract members data from API response structure
      const membersData = response?.data?.members || response?.data?.members || [];
      console.log('Raw Members Data:', membersData); // Debug log
      
      // Normalize members data for UI consumption
      const normalizedMembers = membersData.map((member) => {
        const name =
          `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
          member.name ||
          member.username ||
          t('groups.unknownUser');
        const profileImageRaw =
          member.profile_image ??
          member.profileImage ??
          member.avatar ??
          member.image_url ??
          member.img_url ??
          null;

        return {
          id: member.id,
          name,
          email: member.email || t('groups.noEmail'),
          role: member.role || 'Member',
          profileImage: resolveImageUrl(profileImageRaw),
          joinedDate: member.joined_at || new Date().toISOString(),
        };
      });
      
      console.log('Normalized Members:', normalizedMembers); // Debug log
      setMembers(normalizedMembers);
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
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
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
        <p className="text-gray-500 text-lg">{t('groups.groupNotFound')}</p>
        <button
          onClick={() => navigate('/group')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('groups.backToGroups')}
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
        <span className="font-medium">{t('groups.backToGroups')}</span>
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
                  <span className="font-medium text-gray-700">{t('groups.members', { count: group.members })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-700">{t('groups.events', { count: group.events })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-700">{t('groups.created', { date: formatDate(group.createdDate) })}</span>
                </div>
              </div>
            </div>

            {/* Create Event Button */}
            {isOrganizer && ( 
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('groups.createEvent')}</span>
            </button>
            )}
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
              {t('groups.eventsTab', { count: events.length })}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'members'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {t('groups.membersTab', { count: members.length })}
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
                  <p className="text-gray-500 text-lg mb-2">{t('groups.noEventsYet')}</p>
                  {isOrganizer && (
                  <p className="text-gray-400 text-sm mb-4">{t('groups.beFirstToCreate')}</p>
                  )}
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
                            {t('events.allEvents.categories.' + (event.category?.toLowerCase() || 'other'))}
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
                            <span>{t('groups.attendance')}</span>
                            <span>{t('groups.registered', { registered: event.registered, max: event.maxAttendees })}</span>
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
                  <p className="text-gray-500 text-lg">{t('groups.noMembersYet')}</p>
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
                        <MemberAvatar name={member.name} profileImage={member.profileImage} />
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-gray-900 truncate">{member.name}</h4>
                          {member.role === 'Admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {t('groups.admin')}
                            </span>
                          )}
                          {member.role === 'Moderator' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {t('groups.moderator')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('groups.joined', { date: formatDate(member.joinedDate) })}</p>
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
