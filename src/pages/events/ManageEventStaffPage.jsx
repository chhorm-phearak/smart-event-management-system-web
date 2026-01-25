import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService, staffService } from '@/services';

export const ManageEventStaffPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEventData();
    fetchStaff();
  }, [id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      // const eventData = await eventService.getEventById(id);
      // const staffData = await eventService.getEventStaff(id);
      
      const mockEvent = {
        id: id,
        title: 'Tech Conference 2024',
        date: '2024-03-15',
        location: 'Convention Center, New York'
      };

      const mockAssignedStaff = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          role: 'Check-In Staff',
          assignedDate: '2024-02-20',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
        },
        {
          id: 2,
          name: 'Borey KOKO',
          email: 'borey.koko@example.com',
          role: 'Event Support',
          assignedDate: '2024-02-20',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        {
          id: 3,
          name: 'Sarah Williams',
          email: 'sarah.williams@example.com',
          role: 'Check-In Staff',
          assignedDate: '2024-02-22',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
        }
      ];

      setEvent(mockEvent);
      setAssignedStaff(mockAssignedStaff);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      // Mock data - replace with actual API call
      // const data = await staffService.getAllStaff();
      const mockStaff = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Event Manager' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Coordinator' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Support Staff' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Event Manager' },
        { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Coordinator' },
        { id: 6, name: 'Emily Davis', email: 'emily@example.com', role: 'Support Staff' },
      ];
      setAvailableStaff(mockStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAssignStaff = async (staffId, role) => {
    try {
      // await eventService.assignStaffToEvent(id, staffId, role);
      console.log('Assigning staff:', staffId, role);
      // Refresh the assigned staff list
      fetchEventData();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning staff:', error);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to remove this staff member from the event?')) {
      try {
        // await eventService.removeStaffFromEvent(id, staffId);
        console.log('Removing staff:', staffId);
        setAssignedStaff(assignedStaff.filter(s => s.id !== staffId));
      } catch (error) {
        console.error('Error removing staff:', error);
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
                    {staff.role}
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
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="check-in">Check-In Staff</option>
                  <option value="support">Event Support</option>
                </select>
              </div>
              {filteredStaff.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No staff members available</p>
              ) : (
                <div className="space-y-3">
                  {filteredStaff.map((staff) => {
                    const isAssigned = assignedStaff.some(s => s.id === staff.id);
                    return (
                      <div
                        key={staff.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg ${
                          isAssigned
                            ? 'border-gray-200 bg-gray-50 opacity-60'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                        onClick={() => !isAssigned && handleAssignStaff(staff.id, 'Check-In Staff')}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-semibold">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-500">{staff.email}</p>
                          <p className="text-xs text-gray-400 mt-1">{staff.role}</p>
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
