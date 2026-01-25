import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const OrganizationMembersPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMode, setInviteMode] = useState('email'); // 'email' or 'search'
  const [inviteEmail, setInviteEmail] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      // const data = await organizationService.getMembers();
      
      const mockMembers = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          assignedDate: '2024-02-20',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        },
        {
          id: 2,
          name: 'Borey KOKO',
          email: 'borey.koko@example.com',
          assignedDate: '2024-02-20',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        {
          id: 3,
          name: 'Sarah Williams',
          email: 'sarah.williams@example.com',
          assignedDate: '2024-02-22',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
        },
        {
          id: 4,
          name: 'John Doe',
          email: 'john.doe@example.com',
          assignedDate: '2024-02-25',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
        },
        {
          id: 5,
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          assignedDate: '2024-03-01',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
        },
        {
          id: 6,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          assignedDate: '2024-03-05',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
          id: 7,
          name: 'Lisa Anderson',
          email: 'lisa.anderson@example.com',
          assignedDate: '2024-03-10',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop'
        },
        {
          id: 8,
          name: 'David Brown',
          email: 'david.brown@example.com',
          assignedDate: '2024-03-15',
          role: 'Member',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
        }
      ];

      setMembers(mockMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (email = null, userId = null) => {
    const emailToInvite = email || inviteEmail;
    if (!emailToInvite.trim() && !userId) return;
    
    try {
      // await organizationService.inviteMember(emailToInvite || userId);
      console.log('Inviting member:', emailToInvite || userId);
      setInviteEmail('');
      setUserSearchQuery('');
      setSearchResults([]);
      setShowInviteModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Mock data - replace with actual API call
      // const data = await userService.searchUsers(query);
      
      const mockUsers = [
        {
          id: 101,
          name: 'Robert Taylor',
          email: 'robert.taylor@example.com',
          username: 'robert_taylor',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        {
          id: 102,
          name: 'Jennifer Lee',
          email: 'jennifer.lee@example.com',
          username: 'jennifer_lee',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        },
        {
          id: 103,
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          username: 'michael_chen',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        {
          id: 104,
          name: 'Amanda Wilson',
          email: 'amanda.wilson@example.com',
          username: 'amanda_wilson',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
        }
      ].filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the organization?')) {
      try {
        // await organizationService.removeMember(memberId);
        console.log('Removing member:', memberId);
        setMembers(members.filter(m => m.id !== memberId));
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                    <p className="text-xs text-gray-500">Assigned on {member.assignedDate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    member.role === 'Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {member.role}
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
            ))}
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
                      setSearchResults([]);
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      An invitation email will be sent to this address
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleInviteMember()}
                      disabled={!inviteEmail.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Invitation
                    </button>
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Cancel
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
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          handleSearchUsers(e.target.value);
                        }}
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
                            const isAlreadyMember = members.some(m => m.email === user.email);
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
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                                {isAlreadyMember ? (
                                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                                    Already Member
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleInviteMember(user.email, user.id)}
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
