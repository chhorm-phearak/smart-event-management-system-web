import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const GroupPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for creating group
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Invite User states
  const [inviteSubTab, setInviteSubTab] = useState('user');
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [emailInvite, setEmailInvite] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    fetchGroupsData();
  }, []);

  const fetchGroupsData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockGroups = [
        {
          id: 1,
          name: 'Web Development',
          description: 'A group full of web developers',
          members: 100,
          events: 12,
          image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
          isJoined: false
        },
        {
          id: 2,
          name: 'Mobile Development',
          description: 'Learn and share mobile app development',
          members: 75,
          events: 8,
          image: 'https://images.unsplash.com/photo-1512941937449-8a5a3e6a3a5c?w=400&h=200&fit=crop',
          isJoined: false
        },
        {
          id: 3,
          name: 'Data Science',
          description: 'Exploring data science and machine learning',
          members: 150,
          events: 15,
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
          isJoined: true
        }
      ];

      const mockInvitations = [
        {
          id: 1,
          groupName: 'Ntti School',
          description: 'This group is for up coming event in NTTI',
          invitedBy: 'Sam Rathanak',
          email: 'nak1234@gmail.com',
          date: '4/12/2026',
          status: 'pending'
        },
        {
          id: 2,
          groupName: 'Tech Innovators',
          description: 'Group for technology enthusiasts and innovators',
          invitedBy: 'John Doe',
          email: 'john.doe@example.com',
          date: '4/10/2026',
          status: 'pending'
        },
        {
          id: 3,
          groupName: 'AI Research Group',
          description: 'Advanced AI research and discussions',
          invitedBy: 'Dr. Sarah Smith',
          email: 'sarah.smith@university.edu',
          date: '4/8/2026',
          status: 'pending'
        }
      ];

      setGroups(mockGroups);
      setMyGroups(mockGroups.filter(group => group.isJoined));
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Error fetching groups data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && groupDescription.trim()) {
      const newGroup = {
        id: groups.length + 1,
        name: groupName,
        description: groupDescription,
        members: 1,
        events: 0,
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
        isJoined: true
      };

      setGroups([...groups, newGroup]);
      setMyGroups([...myGroups, newGroup]);
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
    }
  };

  const handleAcceptInvitation = (invitationId) => {
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
    // You could add logic to join the group here
  };

  const handleRejectInvitation = (invitationId) => {
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleInviteUser = (userId) => {
    // Logic to invite user to selected group
    console.log(`Inviting user ${userId} to group ${selectedGroupForInvite}`);
    // You would typically make an API call here
  };

  const handleEmailInvite = () => {
    if (emailInvite.trim() && selectedGroupForInvite) {
      console.log(`Sending email invite to ${emailInvite} for group ${selectedGroupForInvite}`);
      // API call logic here
      setEmailInvite('');
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
    if (term.trim()) {
      // Mock user search - in real app, this would be an API call
      const mockUsers = [
        { id: 1, username: 'Koda123', email: 'kudo@gmail.com', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
        { id: 2, username: 'JohnDoe', email: 'john@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
        { id: 3, username: 'SarahSmith', email: 'sarah@example.com', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop' },
        { id: 4, username: 'MikeJohnson', email: 'mike@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' }
      ];
      
      const filtered = mockUsers.filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFoundUsers(filtered);
    } else {
      setFoundUsers([]);
    }
  };

  const generateInviteLink = () => {
    if (selectedGroupForInvite) {
      const link = `https://eventplatform.com/invite/${selectedGroupForInvite}/${Math.random().toString(36).substr(2, 9)}`;
      setInviteLink(link);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

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
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
            <p className="text-gray-600 mt-1">Join groups and participate in group events</p>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeTab === 'all' ? filteredGroups : activeTab === 'my' ? myGroups : []).map((group) => (
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
          </div>

          {/* Invite User Tab Content */}
          {activeTab === 'invite' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Invitations</h3>
              
              {/* Select Group Dropdown */}
              <div className="mb-6">
                <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
                <select
                  id="group-select"
                  value={selectedGroupForInvite}
                  onChange={(e) => setSelectedGroupForInvite(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                >
                  <option value="">Choose a group...</option>
                  {myGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
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
                        placeholder="Search by username or email"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Found Users */}
                  <div className="space-y-4">
                    {foundUsers.length === 0 && userSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    ) : foundUsers.length === 0 && !userSearchTerm.trim() ? (
                      <p className="text-gray-500 text-center py-4">Start typing to search for users</p>
                    ) : (
                      foundUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(user.id)}
                            disabled={!selectedGroupForInvite}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Invite
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Email Invitation Sub-tab */}
              {inviteSubTab === 'email' && (
                <div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={emailInvite}
                      onChange={(e) => setEmailInvite(e.target.value)}
                      placeholder="Enter email address to invite"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleEmailInvite}
                    disabled={!emailInvite.trim() || !selectedGroupForInvite}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Email Invitation
                  </button>
                </div>
              )}

              {/* Invite Link Sub-tab */}
              {inviteSubTab === 'link' && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={generateInviteLink}
                      disabled={!selectedGroupForInvite}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      Generate Invite Link
                    </button>
                    
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
                  </div>
                  
                  {!inviteLink && selectedGroupForInvite && (
                    <p className="text-gray-500 text-center py-8">
                      Click "Generate Invite Link" to create a shareable link for your group
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
          )}
        </div>

        {/* Group Invitations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Group Invitations</h3>
              {pendingInvitations.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {pendingInvitations.length} new
                </span>
              )}
            </div>

            <div className="space-y-4">
              {pendingInvitations.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No new invitations</p>
              ) : (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{invitation.groupName}</h4>
                    <p className="text-sm text-gray-600 mb-3">{invitation.description}</p>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      <div>invited by {invitation.invitedBy}</div>
                      <div>{invitation.email}</div>
                      <div>{invitation.date}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                disabled={!groupName.trim() || !groupDescription.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

