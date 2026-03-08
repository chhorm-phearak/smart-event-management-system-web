import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { groupService, userService } from '@/services';
import api from '@/services/api';

const DEBOUNCE_MS = 400;

const DEFAULT_GROUP_IMAGE = 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop';

// Normalize API group to UI shape (accept common API field names)
const normalizeGroup = (g) => {
  if (!g || typeof g !== 'object') return null;
  return {
    id: g.id ?? g.group_id ?? g.groupId,
    name: (g.name ?? g.group_name ?? g.groupName ?? '').toString(),
    description: (g.description ?? g.group_description ?? g.groupDescription ?? '').toString(),
    image: g.image ?? g.image_url ?? g.avatar ?? DEFAULT_GROUP_IMAGE,
    members: g.members ?? g.member_count ?? g.memberCount ?? 0,
    events: g.events ?? g.event_count ?? g.eventCount ?? 0,
    isJoined: g.isJoined ?? g.is_joined ?? false,
  };
};

// Normalize API user to { id, fullName, email, avatar } for display
const normalizeUser = (u) => {
  if (!u || typeof u !== 'object') return null;
  const id = u.id ?? u.user_id ?? u.userId;
  if (id == null) return null;
  const fullName = (u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.name || '').toString().trim() || '—';
  return {
    id,
    fullName,
    email: (u.email ?? '').toString(),
    avatar: u.avatar ?? u.image ?? u.image_url ?? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  };
};

const toGroupList = (data) => {
  if (data == null) return [];
  if (Array.isArray(data)) {
    return data.map(normalizeGroup).filter(Boolean);
  }
  if (typeof data !== 'object') return [];
  // API returns { groups: [ {...}, ... ] } — pick the array
  let list = data.groups ?? data.data ?? data.result ?? data.results ?? data.items ?? data.content;
  if (!Array.isArray(list) && list && typeof list === 'object') {
    list = list.groups ?? list.data ?? list.results ?? list.items ?? list.content ?? Object.values(list).find((v) => Array.isArray(v));
  }
  if (!Array.isArray(list)) {
    list = list && typeof list === 'object' && (list.id != null || list.group_id != null) ? [list] : [];
  }
  const arr = Array.isArray(list) ? list : [];
  return arr.map(normalizeGroup).filter(Boolean);
};

export const GroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log('Current User in GroupPage:', user); // Debug log
  const organizationId = user?.organization_id ?? user?.organizationId ?? user?.organization?.id ?? null;
  console.log('Extracted Organization ID:', organizationId); // Debug log

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state for creating group
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Invite User states
  const [inviteSubTab, setInviteSubTab] = useState('user');
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchDebounceRef = useRef(null);
  // Email invitation search (same pattern as user search)
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [foundUsersByEmail, setFoundUsersByEmail] = useState([]);
  const [emailSearchLoading, setEmailSearchLoading] = useState(false);
  const emailSearchDebounceRef = useRef(null);

  // Invite Link states
  const [inviteMaxUses, setInviteMaxUses] = useState(10);
  const [inviteExpiresIn, setInviteExpiresIn] = useState(30); // days
  const [inviteMessage, setInviteMessage] = useState('Join our awesome group!');
  
  // Custom dropdown state
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Event creation state
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedGroupIdForEvent, setSelectedGroupIdForEvent] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventShortDescription, setEventShortDescription] = useState('');
  const [eventLongDescription, setEventLongDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventFullAddress, setEventFullAddress] = useState('');
  const [eventCapacity, setEventCapacity] = useState('');
  const [eventIsPublic, setEventIsPublic] = useState(true);
  const [createEventLoading, setCreateEventLoading] = useState(false);

  useEffect(() => {
    fetchGroupsData();
  }, [organizationId]);

  // Debounced user search: call API only when user stops typing
  useEffect(() => {
    const term = userSearchTerm.trim();
    if (!term) {
      setFoundUsers([]);
      setUserSearchLoading(false);
      return;
    }
    if (userSearchDebounceRef.current) {
      clearTimeout(userSearchDebounceRef.current);
    }
    userSearchDebounceRef.current = setTimeout(async () => {
      userSearchDebounceRef.current = null;
      setUserSearchLoading(true);
      try {
        const data = await userService.searchUsers(term);
        const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? data?.results ?? []);
        setFoundUsers(list.map(normalizeUser).filter(Boolean));
      } catch (err) {
        console.error('User search failed:', err);
        setFoundUsers([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (userSearchDebounceRef.current) {
        clearTimeout(userSearchDebounceRef.current);
      }
    };
  }, [userSearchTerm]);

  // Debounced email search for Email Invitation tab
  useEffect(() => {
    const term = emailSearchTerm.trim();
    if (!term) {
      setFoundUsersByEmail([]);
      setEmailSearchLoading(false);
      return;
    }
    if (emailSearchDebounceRef.current) {
      clearTimeout(emailSearchDebounceRef.current);
    }
    emailSearchDebounceRef.current = setTimeout(async () => {
      emailSearchDebounceRef.current = null;
      setEmailSearchLoading(true);
      try {
        const data = await userService.searchUsersByEmail(term);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? data?.results ?? []);
        setFoundUsersByEmail(list.map(normalizeUser).filter(Boolean));
      } catch (err) {
        console.error('Email search failed:', err);
        setFoundUsersByEmail([]);
      } finally {
        setEmailSearchLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (emailSearchDebounceRef.current) {
        clearTimeout(emailSearchDebounceRef.current);
      }
    };
  }, [emailSearchTerm]);

  const fetchGroupsData = async () => {
    setLoading(true);
    setError(null);

    const [allResult, orgResult, invitationsResult] = await Promise.allSettled([
      groupService.getAllGroups(),
      groupService.getGroupsByOrganization(),
      api.get('/invitations/received?status=PENDING'),
    ]);

    const allData = allResult.status === 'fulfilled' ? allResult.value : null;
    const byOrgData = orgResult.status === 'fulfilled' ? orgResult.value : null;
    const invitationsData = invitationsResult.status === 'fulfilled' ? invitationsResult.value : null;

    if (allResult.status === 'rejected') {
      console.error('Get all groups failed:', allResult.reason);
      setError(allResult.reason?.response?.data?.message || allResult.reason?.message || 'Failed to load all groups');
    }
    if (orgResult.status === 'rejected') {
      console.warn('Get groups by organization failed:', orgResult.reason?.response?.status, orgResult.reason?.message);
    }
    if (invitationsResult.status === 'rejected') {
      console.warn('Get invitations failed:', invitationsResult.reason?.response?.status, invitationsResult.reason?.message);
    }

    setGroups(toGroupList(allData));
    setMyGroups(toGroupList(byOrgData ?? []));
    
    // Process invitations data
    const invitationsList = invitationsData?.data?.data || [];
    setInvitations(invitationsList);
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) return;
    try {
      setCreateLoading(true);
      setError(null);
      await groupService.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
      });
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
      await fetchGroupsData();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!selectedGroupIdForEvent || !eventTitle.trim() || !eventShortDescription.trim()) return;
    
    try {
      setCreateEventLoading(true);
      setError(null);
      
      console.log('Creating event with organizationId:', organizationId); // Debug log
      console.log('Selected group for event:', selectedGroupIdForEvent); // Debug log
      
      await groupService.createGroupEvent(selectedGroupIdForEvent, {
        title: eventTitle.trim(),
        shortDescription: eventShortDescription.trim(),
        longDescription: eventLongDescription.trim(),
        category: eventCategory || 'General',
        startTime: eventStartTime,
        endTime: eventEndTime,
        location: eventLocation.trim(),
        fullAddress: eventFullAddress.trim(),
        capacity: parseInt(eventCapacity) || 50,
        isPublic: eventIsPublic,
      });
      
      // Reset form
      setEventTitle('');
      setEventShortDescription('');
      setEventLongDescription('');
      setEventCategory('');
      setEventStartTime('');
      setEventEndTime('');
      setEventLocation('');
      setEventFullAddress('');
      setEventCapacity('');
      setEventIsPublic(true);
      setSelectedGroupIdForEvent('');
      setShowCreateEventModal(false);
      
      // Refresh groups to get updated event count
      await fetchGroupsData();
      
      alert('Event created successfully!');
    } catch (err) {
      console.error('Error creating event:', err);
      console.error('Error response:', err.response?.data); // Debug log
      setError(err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setCreateEventLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/accept`);
      console.log('Invitation accepted successfully:', response.data);
      
      // Remove from pending invitations
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      // Refresh groups data to include the new group
      await fetchGroupsData();
      
      alert('Invitation accepted! You have joined the group.');
      
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert(`Failed to accept invitation: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/reject`);
      console.log('Invitation rejected successfully:', response.data);
      
      // Remove from pending invitations
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      alert('Invitation rejected.');
      
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      alert(`Failed to reject invitation: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleInviteUser = async (userId) => {
    if (!selectedGroupForInvite || !userId) return;
    
    try {
      const response = await api.post('/invitations/group/invite', {
        group_id: selectedGroupForInvite,
        user_id: userId,
        role: 'member',
        message: 'Join our group!'
      });

      console.log('User invited successfully:', response.data);
      
      // You could add a success notification here
      alert('User invited successfully!');
      
      // Optionally refresh the user list or update UI state
      // For now, just log the success
      
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert(`Failed to invite user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDirectEmailInvite = async (email) => {
    if (!selectedGroupForInvite || !email) return;
    
    try {
      const response = await api.post('/invitations/group/invite-by-email', {
        group_id: selectedGroupForInvite,
        email: email,
        role: 'member',
        message: 'Join our group!'
      });

      console.log('Email invitation sent successfully:', response.data);
      
      alert('Email invitation sent successfully!');
      
    } catch (error) {
      console.error('Failed to send email invitation:', error);
      alert(`Failed to send email invitation: ${error.response?.data?.message || error.message}`);
    }
  };


  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      // You could add a toast notification here
    }
  };

  const handleUserSearch = (term) => {
    setUserSearchTerm(term);
  };

  const generateInviteLink = async () => {
    if (!selectedGroupForInvite) return;
    
    try {
      setError(null);
      const response = await api.post(`/groups/${selectedGroupForInvite}/invite-links`, {
        max_uses: inviteMaxUses,
        expires_at: new Date(Date.now() + inviteExpiresIn * 24 * 60 * 60 * 1000).toISOString(), // Convert days to milliseconds
        message: inviteMessage
      });
      
      const inviteUrl = response.data.data.inviteUrl;
      setInviteLink(inviteUrl);
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(inviteUrl);
      alert('Invite link generated and copied to clipboard!');
      
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate invite link');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
  const displayedGroups = activeTab === 'all' ? filteredGroups : activeTab === 'my' ? myGroups : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss">×</button>
        </div>
      )}
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
            <p className="text-gray-600 mt-1">Join groups and participate in group events</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Group
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'my'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invite User
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-[calc(100vh-18rem)] items-stretch">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'my' && !organizationId && myGroups.length === 0 && !loading && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-6 rounded-lg text-center">
                You need to be part of an organization to see your groups here.
              </div>
            )}
            {displayedGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Group Image */}
                <div className="h-48 bg-gray-200">
                  <img 
                    src={group.image} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Group Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>{group.members} Members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{group.events} Events</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewGroup(group.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Group</span>
                  </button>
                </div>
              </div>
            ))}
            {(activeTab === 'all' || activeTab === 'my') && displayedGroups.length === 0 && !loading && (
              <div className="col-span-2 bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {activeTab === 'my' ? 'No groups in your organization yet' : 'No groups found'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm.trim()
                    ? 'Try another search keyword.'
                    : activeTab === 'my'
                      ? 'Create a group or wait for group data to appear here.'
                      : 'No group data available right now.'}
                </p>
              </div>
            )}
          </div>

          {/* Invite User Tab Content */}
          {activeTab === 'invite' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Invitations</h3>
              
              <div className="flex-1 overflow-y-auto">
              
              {/* Select Group Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span>Choose Group for Invitation</span>
                  </div>
                </label>
                
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {selectedGroupForInvite ? (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {myGroups.find(g => g.id === selectedGroupForInvite)?.name || 'Selected group'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {myGroups.find(g => g.id === selectedGroupForInvite)?.members || 0} members
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-gray-500">Select a group to invite users...</div>
                        </>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showGroupDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Options */}
                  {showGroupDropdown && (
                    <div className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {myGroups.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">No groups available</p>
                          <p className="text-xs text-gray-500">Create a group first to start inviting users</p>
                        </div>
                      ) : (
                        myGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => {
                              setSelectedGroupForInvite(group.id);
                              setShowGroupDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{group.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  {group.members || 0} members
                                </div>
                              </div>
                              {selectedGroupForInvite === group.id && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selection Confirmation */}
                {selectedGroupForInvite && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          Ready to invite users to <strong>{myGroups.find(g => g.id === selectedGroupForInvite)?.name || 'Selected group'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="flex space-x-8 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setInviteSubTab('user')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'user'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  User Invitation
                </button>
                <button
                  onClick={() => setInviteSubTab('email')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'email'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Email Invitation
                </button>
                <button
                  onClick={() => setInviteSubTab('link')}
                  className={`pb-4 px-1 text-sm font-medium transition-colors ${
                    inviteSubTab === 'link'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Invite Link
                </button>
              </div>

              {/* User Invitation Sub-tab */}
              {inviteSubTab === 'user' && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by username"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {userSearchLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Found Users */}
                  <div className="space-y-4">
                    {foundUsers.length === 0 && userSearchTerm.trim() && !userSearchLoading ? (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    ) : foundUsers.length === 0 && !userSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">Start typing to search for users</p>
                    ) : foundUsers.length > 0 ? (
                      foundUsers.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{u.fullName}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(u.id)}
                            disabled={!selectedGroupForInvite}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Invite
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}

              {/* Email Invitation Sub-tab */}
              {inviteSubTab === 'email' && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by email"
                        value={emailSearchTerm}
                        onChange={(e) => setEmailSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {emailSearchLoading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Found Users by Email */}
                  <div className="space-y-4">
                    {foundUsersByEmail.length === 0 && emailSearchTerm.trim() && !emailSearchLoading ? (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    ) : foundUsersByEmail.length === 0 && !emailSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">Start typing to search by email</p>
                    ) : foundUsersByEmail.length > 0 ? (
                      foundUsersByEmail.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{u.fullName}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(u.id)}
                            disabled={!selectedGroupForInvite}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Invite
                          </button>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              )}

              {/* Invite Link Sub-tab */}
              {inviteSubTab === 'link' && (
                <div>
                  {/* Invite Settings */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4">Invite Link Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Max Uses */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Users Can Join
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={inviteMaxUses}
                          onChange={(e) => setInviteMaxUses(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                      </div>

                      {/* Expires In */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expires In (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={inviteExpiresIn}
                          onChange={(e) => setInviteExpiresIn(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Days until link expires</p>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Message
                        </label>
                        <input
                          type="text"
                          value={inviteMessage}
                          onChange={(e) => setInviteMessage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Join our awesome group!"
                          maxLength="200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Personal message for invitees</p>
                      </div>
                    </div>

                    <button
                      onClick={generateInviteLink}
                      disabled={!selectedGroupForInvite}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Invite Link
                    </button>
                  </div>
                    
                  {inviteLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inviteLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                        <button
                          onClick={handleCopyInviteLink}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Copy link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!inviteLink && selectedGroupForInvite && (
                    <p className="text-gray-500 text-center py-8">
                      Configure settings above and click "Generate Invite Link" to create a shareable link for your group
                    </p>
                  )}
                  
                  {!selectedGroupForInvite && (
                    <p className="text-gray-500 text-center py-8">
                      Please select a group first to generate an invite link
                    </p>
                  )}
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Group Invitations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Received Invitations</h3>
              </div>
              {pendingInvitations.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {pendingInvitations.length} new
                </span>
              )}
            </div>

            {/* Invitation List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 mb-1">No invitations yet</p>
                  <p className="text-xs text-gray-500">Group invitations will appear here</p>
                </div>
              ) : (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">{invitation.group_name}</h4>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {invitation.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(invitation.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    {invitation.message && (
                      <div className="bg-blue-50 rounded-lg p-2 mb-3 border-l-3 border-blue-200">
                        <p className="text-xs text-blue-700 italic">"{invitation.message}"</p>
                      </div>
                    )}

                    {/* Inviter Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">
                          <span className="font-medium">{invitation.inviter_first_name} {invitation.inviter_last_name}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{invitation.inviter_email}</span>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-xs text-gray-600">Role: <span className="font-medium text-gray-800 capitalize">{invitation.role}</span></span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {pendingInvitations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  {pendingInvitations.length} invitation{pendingInvitations.length > 1 ? 's' : ''} pending
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || !groupDescription.trim() || createLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Group Selection */}
            <div className="mb-6">
              <label htmlFor="event-group-select" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Select Group
                </div>
              </label>
              <select
                id="event-group-select"
                value={selectedGroupIdForEvent}
                onChange={(e) => setSelectedGroupIdForEvent(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a group...</option>
                {myGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.events} events)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Title */}
              <div>
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  id="event-title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  id="event-category"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Technology">Technology</option>
                  <option value="Social">Social</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Short Description */}
              <div className="md:col-span-2">
                <label htmlFor="event-short-desc" className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
                <textarea
                  id="event-short-desc"
                  value={eventShortDescription}
                  onChange={(e) => setEventShortDescription(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of your event"
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  id="event-start-time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  id="event-end-time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event location"
                />
              </div>

              {/* Full Address */}
              <div>
                <label htmlFor="event-full-address" className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <input
                  type="text"
                  id="event-full-address"
                  value={eventFullAddress}
                  onChange={(e) => setEventFullAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Complete event address"
                />
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  id="event-capacity"
                  value={eventCapacity}
                  onChange={(e) => setEventCapacity(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Maximum number of attendees"
                  min="1"
                />
              </div>

              {/* Is Public */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={eventIsPublic}
                    onChange={(e) => setEventIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Make this event public</span>
                </label>
              </div>

              {/* Long Description */}
              <div className="md:col-span-2">
                <label htmlFor="event-long-desc" className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                <textarea
                  id="event-long-desc"
                  value={eventLongDescription}
                  onChange={(e) => setEventLongDescription(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed description of your event"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!selectedGroupIdForEvent || !eventTitle.trim() || !eventShortDescription.trim() || createEventLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createEventLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

