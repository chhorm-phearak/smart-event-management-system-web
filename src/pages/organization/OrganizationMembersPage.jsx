import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userService, organizationService } from '@/services';

const DEBOUNCE_MS = 400;

export const OrganizationMembersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMode, setInviteMode] = useState('email'); // 'email' or 'search'
  const [inviteEmail, setInviteEmail] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedMembers, setSearchedMembers] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const searchDebounceRef = useRef(null);
  const userSearchDebounceRef = useRef(null);
  const emailSearchDebounceRef = useRef(null);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const response = await organizationService.getOrganizationMembers();
      console.log('Organization members response:', response);
      
      // Extract organization ID from the response
      const organizationData = response?.data?.[0];
      const orgId = organizationData?.organization?.id;
      
      if (orgId) {
        setOrganizationId(orgId);
      }
      
      // Extract and format members
      const membersList = organizationData?.members || [];
      const formattedMembers = membersList.map(member => ({
        id: member.id,
        user_id: member.user_id,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email?.split('@')[0] || 'Unknown',
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        assignedDate: member.joined_at ? new Date(member.joined_at).toISOString().split('T')[0] : 'N/A',
        joined_at: member.joined_at,
        role: 'Member',
        avatar: member.img_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        image_url: member.img_url,
        profile_contact: member.profile_contact
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search for members by name/email
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSearchedMembers([]);
      setIsSearchingMembers(false);
      return;
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(async () => {
      searchDebounceRef.current = null;
      setIsSearchingMembers(true);
      try {
        const data = await userService.searchUsersByEmail(term);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? data?.results ?? []);
        setSearchedMembers(list);
      } catch (err) {
        console.error('Member search failed:', err);
        setSearchedMembers([]);
      } finally {
        setIsSearchingMembers(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  // Debounced search for invite modal user search (Search by Username tab)
  useEffect(() => {
    const term = userSearchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    if (userSearchDebounceRef.current) {
      clearTimeout(userSearchDebounceRef.current);
    }
    userSearchDebounceRef.current = setTimeout(async () => {
      userSearchDebounceRef.current = null;
      setIsSearching(true);
      try {
        const data = await userService.searchUsersByEmail(term);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? data?.results ?? []);
        setSearchResults(list);
      } catch (err) {
        console.error('User search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (userSearchDebounceRef.current) {
        clearTimeout(userSearchDebounceRef.current);
      }
    };
  }, [userSearchQuery]);

  // Debounced search for email invite mode (Invite by Email tab)
  useEffect(() => {
    const term = inviteEmail.trim();
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    if (emailSearchDebounceRef.current) {
      clearTimeout(emailSearchDebounceRef.current);
    }
    emailSearchDebounceRef.current = setTimeout(async () => {
      emailSearchDebounceRef.current = null;
      setIsSearching(true);
      try {
        const data = await userService.searchUsersByEmail(term);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? data?.results ?? []);
        setSearchResults(list);
      } catch (err) {
        console.error('Email search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (emailSearchDebounceRef.current) {
        clearTimeout(emailSearchDebounceRef.current);
      }
    };
  }, [inviteEmail]);


  const handleInviteMember = async (email = null, userId = null) => {
    if (!userId) {
      alert('User ID is required to send invitation');
      return;
    }
    
    if (!organizationId) {
      alert('You must be part of an organization to invite members');
      return;
    }
    
    try {
      const message = 'Join our organization and collaborate with us!';
      await organizationService.inviteMember(organizationId, userId, message);
      
      alert('Invitation sent successfully!');
      
      // Reset form and close modal
      setInviteEmail('');
      setUserSearchQuery('');
      setSearchResults([]);
      setShowInviteModal(false);
      
      // Optionally refresh members list
      // fetchOrganizationData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(error.response?.data?.message || error.message || 'Failed to send invitation');
    }
  };


  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the organization?')) {
      try {
        await organizationService.removeMember(memberId);
        
        // Remove from local state
        setMembers(members.filter(m => m.id !== memberId));
        
        alert('Member removed successfully!');
      } catch (error) {
        console.error('Error removing member:', error);
        alert(error.response?.data?.message || error.message || 'Failed to remove member');
      }
    }
  };

  // Use API search results if searching, otherwise show all members
  const filteredMembers = searchTerm.trim() ? searchedMembers : members;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Members</h1>
            <p className="text-gray-600">Manage members of Tech Events Inc.</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isSearchingMembers && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Members ({members.length})
          </h2>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No members found</p>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm ? 'Try a different search term' : 'Invite members to join your organization'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Invite Member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const memberName = member.name || member.full_name || [member.first_name, member.last_name].filter(Boolean).join(' ') || member.username || '—';
              const memberEmail = member.email || '';
              const memberAvatar = member.avatar || member.image || member.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
              const memberRole = member.role || 'Member';
              const memberDate = member.assignedDate || member.assigned_date || member.created_at || 'N/A';
              
              return (
                <div
                  key={member.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={memberAvatar}
                        alt={memberName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{memberName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{memberEmail}</p>
                      <p className="text-xs text-gray-500">Assigned on {memberDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      memberRole === 'Admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {memberRole}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Invite Member</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setUserSearchQuery('');
                  setSearchResults([]);
                  setInviteMode('email');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Mode Toggle */}
              <div className="mb-6">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setInviteMode('email');
                      setUserSearchQuery('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                      inviteMode === 'email'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Invite by Email
                  </button>
                  <button
                    onClick={() => {
                      setInviteMode('search');
                      setInviteEmail('');
                      setSearchResults([]);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all ${
                      inviteMode === 'search'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Search by Username
                  </button>
                </div>
              </div>

              {/* Email Invite Mode */}
              {inviteMode === 'email' && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Search by Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Search by email..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Search for users by email to invite them to your organization
                    </p>
                  </div>

                  {/* Search Results */}
                  {inviteEmail.trim() && (
                    <div className="mb-4">
                      {searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((user) => {
                            const userName = user.name || user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '—';
                            const userEmail = user.email || '';
                            const userAvatar = user.avatar || user.image || user.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
                            const userUsername = user.username || user.email?.split('@')[0] || '';
                            const isAlreadyMember = members.some(m => m.email === userEmail);
                            
                            return (
                              <div
                                key={user.id}
                                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                                  isAlreadyMember
                                    ? 'border-gray-200 bg-gray-50 opacity-60'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">{userName}</p>
                                  <p className="text-sm text-gray-600">{userEmail}</p>
                                  {userUsername && <p className="text-xs text-gray-500">@{userUsername}</p>}
                                </div>
                                {isAlreadyMember ? (
                                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                                    Already Member
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleInviteMember(userEmail, user.id)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                                  >
                                    Invite
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-gray-600">No users found</p>
                          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                        setSearchResults([]);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Search Username Mode */}
              {inviteMode === 'search' && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Search by Username, Name, or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Search for existing users to invite them to your organization
                    </p>
                  </div>

                  {/* Search Results */}
                  {userSearchQuery.trim() && (
                    <div className="mb-4">
                      {searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((user) => {
                            const userName = user.name || user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '—';
                            const userEmail = user.email || '';
                            const userAvatar = user.avatar || user.image || user.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
                            const userUsername = user.username || user.email?.split('@')[0] || '';
                            const isAlreadyMember = members.some(m => m.email === userEmail);
                            
                            return (
                              <div
                                key={user.id}
                                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                                  isAlreadyMember
                                    ? 'border-gray-200 bg-gray-50 opacity-60'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">{userName}</p>
                                  <p className="text-sm text-gray-600">{userEmail}</p>
                                  {userUsername && <p className="text-xs text-gray-500">@{userUsername}</p>}
                                </div>
                                {isAlreadyMember ? (
                                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                                    Already Member
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleInviteMember(userEmail, user.id)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                                  >
                                    Invite
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-gray-600">No users found</p>
                          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setUserSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
