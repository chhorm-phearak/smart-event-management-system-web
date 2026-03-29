import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService, organizationService } from '@/services';

export const ManageEventStaffPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('CHECK_IN');
  const [error, setError] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchStaff();
    }
  }, [event]);

  useEffect(() => {
    if (showAssignModal && availableStaff.length === 0) {
      console.log('Modal opened, fetching staff...');
      fetchStaff();
    }
  }, [showAssignModal]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventResponse, staffResponse] = await Promise.all([
        eventService.getEventById(id),
        eventService.getEventStaff(id)
      ]);
      
      const eventData = eventResponse?.data;
      const staffData = staffResponse?.data || [];
      
      console.log('Event data:', eventData);
      
      setEvent({
        id: eventData.id,
        title: eventData.title,
        date: new Date(eventData.start_time).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        location: eventData.location
      });

      const transformedStaff = staffData.map(staff => ({
        id: staff.id,
        organizationMemberId: staff.organization_member_id,
        userId: staff.user_id,
        name: `${staff.first_name} ${staff.last_name}`,
        email: staff.email,
        role: staff.role,
        assignedDate: new Date(staff.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        }),
        avatar: staff.img_url || `https://ui-avatars.com/api/?name=${staff.first_name}+${staff.last_name}&background=random`
      }));

      setAssignedStaff(transformedStaff);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      console.log('Fetching organization members...');
      
      const response = await organizationService.getOrganizationMembers();
      console.log('Staff response:', response);
      
      const responseData = response?.data || [];
      
      // Extract members and organization from nested structure
      let allMembers = [];
      let organizationId = null;
      if (responseData.length > 0) {
        allMembers = responseData[0].members || [];
        organizationId = responseData[0].organization?.id;
      }
      
      console.log('Members count:', allMembers.length);
      console.log('Organization ID:', organizationId);
      
      const transformedMembers = allMembers.map(member => ({
        id: member.id,
        userId: member.user_id,
        organizationId: organizationId,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        contact: member.profile_contact,
        avatar: member.img_url || `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=random`,
        joinedAt: new Date(member.joined_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        })
      }));
      
      setAvailableStaff(transformedMembers);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load organization members.');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssignStaff = async (member) => {
    if (!window.confirm(`Assign ${member.name} as ${getRoleLabel(selectedRole)}?`)) {
      return;
    }
    
    try {
      await eventService.assignStaffToEvent(id, member.organizationId, member.userId, selectedRole);
      await fetchEventData();
      setShowAssignModal(false);
      setSelectedRole('CHECK_IN');
    } catch (error) {
      console.error('Error assigning staff:', error);
      setError('Failed to assign staff. Please try again.');
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to remove this staff member from the event?')) {
      try {
        await eventService.removeStaffFromEvent(id, staffId);
        await fetchEventData();
      } catch (error) {
        console.error('Error removing staff:', error);
        setError('Failed to remove staff. Please try again.');
      }
    }
  };

  const filteredStaff = availableStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignedStaff = assignedStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role) => {
    switch (role) {
      case 'CHECK_IN':
        return 'Check-In Staff';
      case 'EVENT_SUPPORT':
        return 'Event Support';
      default:
        return role;
    }
  };

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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Manage Events</span>
        </button>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Event Staff</h1>
            <p className="text-gray-600">
              {event?.title} - {event?.date}
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign Staff
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
            placeholder="Search Staff Members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Assigned Staff Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Assigned Staff ({assignedStaff.length})
          </h2>
        </div>

        {filteredAssignedStaff.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No staff assigned yet</p>
            <p className="text-gray-500 text-sm mb-4">Assign staff members to help manage this event</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Assign Staff
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignedStaff.map((staff) => (
              <div
                key={staff.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{staff.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{staff.email}</p>
                    <p className="text-xs text-gray-500">Assigned on {staff.assignedDate}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {getRoleLabel(staff.role)}
                  </span>
                  <button
                    onClick={() => handleRemoveStaff(staff.id)}
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

      {/* Staff Roles Information */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Roles</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-900">Check-In Staff</p>
              <p className="text-sm text-gray-600">Can scan QR codes and check in participants</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-semibold text-gray-900">Event Support</p>
              <p className="text-sm text-gray-600">Can assist with event operations and management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Assign Staff to Event</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Role</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CHECK_IN">Check-In Staff</option>
                  <option value="EVENT_SUPPORT">Event Support</option>
                </select>
              </div>
              {loadingStaff ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No staff members available</p>
                  <p className="text-gray-400 text-sm">Add members to your organization first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStaff.map((member) => {
                    const isAssigned = assignedStaff.some(s => s.organizationMemberId === member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg ${
                          isAssigned
                            ? 'border-gray-200 bg-gray-50 opacity-60'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                        onClick={() => !isAssigned && handleAssignStaff(member)}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          {member.contact && (
                            <p className="text-xs text-gray-400 mt-1">{member.contact}</p>
                          )}
                        </div>
                        {isAssigned && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                            Already Assigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
