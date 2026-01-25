import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '@/services';

export const MyTicketEventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(true); // Always true since coming from My Ticket page
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // For now, using mock data. Replace with actual API call when backend is ready
      // const data = await eventService.getEventById(id);
      
      // Mock data for demonstration
      const mockEvent = {
        id: id || 1,
        title: 'Tech Conference 2025',
        shortDescription: 'Annual technology conference featuring industry leaders and innovators.',
        description: "This year's Tech Conference brings together the brightest minds in technology. We'll cover topics including AI, cloud computing, cybersecurity, and more. Don't miss this opportunity to learn from industry experts and connect with like-minded professionals.",
        category: 'Technology',
        eventDate: '2024-03-15',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Convention Center, New York',
        fullAddress: '123 Main Street, New York',
        capacity: 150,
        registered: 120,
        price: 0,
        organizer: 'Tech Events Inc.',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop',
        registrationRequired: true,
        qrCodeAvailable: true,
        bringValidId: true,
        agendas: [
          {
            id: 1,
            title: 'Opening Keynote',
            description: 'Welcome address and conference overview',
            startTime: '09:00',
            endTime: '10:00',
            speaker: 'John Smith, CEO',
          },
          {
            id: 2,
            title: 'AI and Machine Learning',
            description: 'Exploring the latest trends in AI and ML technologies',
            startTime: '10:30',
            endTime: '12:00',
            speaker: 'Dr. Jane Doe',
          },
          {
            id: 3,
            title: 'Lunch Break',
            description: 'Networking lunch',
            startTime: '12:00',
            endTime: '13:30',
            speaker: '',
          },
          {
            id: 4,
            title: 'Cloud Computing Workshop',
            description: 'Hands-on workshop on cloud infrastructure',
            startTime: '14:00',
            endTime: '15:30',
            speaker: 'Mike Johnson',
          },
          {
            id: 5,
            title: 'Closing Remarks',
            description: 'Conference wrap-up and future announcements',
            startTime: '16:00',
            endTime: '17:00',
            speaker: 'John Smith, CEO',
          },
        ],
      };
      
      setEvent(mockEvent);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQrTicket = () => {
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
  };

  const handleDownloadQr = () => {
    // Download functionality would go here
    console.log('Downloading QR ticket...');
  };

  const handleCopyTicketCode = () => {
    // Copy ticket code functionality would go here
    console.log('Copying ticket code...');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const attendancePercentage = event ? Math.round((event.registered / event.capacity) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Event not found</p>
        <button
          onClick={() => navigate('/my-ticket')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to My Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => navigate('/my-ticket')}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to My Tickets</span>
      </button>

      {/* Event Image */}
      <div className="mb-6">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-64 object-cover rounded-lg shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purple Banner Background */}
          <div className="bg-purple-100 rounded-lg p-6">
            {/* Category Tag */}
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {event.category}
              </span>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{event.title}</h1>

            {/* Event Description */}
            <p className="text-gray-600 leading-relaxed">
              {event.shortDescription || event.description}
            </p>
          </div>

          {/* Date & Time and Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Date & Time</h3>
              </div>
              <div className="space-y-1">
                <p className="text-gray-900 font-bold text-lg">{formatDate(event.eventDate)}</p>
                <p className="text-gray-700 font-semibold text-base">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>
                <h3 className="text-base font-semibold text-gray-900">Location</h3>
              </div>
              <div className="space-y-1">
                <p className="text-gray-900 font-bold text-lg">{event.location}</p>
                <p className="text-gray-700 font-semibold text-base">{event.fullAddress}</p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Event Information</h2>
            
            <div className="space-y-5">
              {/* Organizer */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Organized by</p>
                  <p className="text-base font-semibold text-gray-900">{event.organizer}</p>
                </div>
              </div>

              {/* Attendance */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Attendance</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-900">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${attendancePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About This Event */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Agenda */}
          {event.agendas && event.agendas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Agenda</h2>
              <div className="space-y-4">
                {event.agendas.map((agenda, index) => (
                  <div key={agenda.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            {formatTime(agenda.startTime)} - {formatTime(agenda.endTime)}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{agenda.title}</h3>
                        {agenda.description && (
                          <p className="text-sm text-gray-600 mb-2">{agenda.description}</p>
                        )}
                        {agenda.speaker && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-sm text-gray-600">Speaker: {agenda.speaker}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            {/* Pricing Section */}
            <div className="bg-blue-600 rounded-lg p-6 mb-4">
              <div className="text-white text-center">
                <div className="text-4xl font-bold">
                  {event.price === 0 ? 'Free' : `$${event.price}`}
                </div>
                <div className="text-sm text-blue-100 mt-2">per ticket</div>
              </div>
            </div>

            {/* Show QR Ticket Button - Always show since coming from My Ticket */}
            <button
              onClick={handleShowQrTicket}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm mb-4"
            >
              Show Qr Ticket
            </button>

            {/* Registered Status - Always show since coming from My Ticket */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">Registered!</span>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Requirements:</h3>
              {event.registrationRequired && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Registration is required</span>
                </div>
              )}
              {event.qrCodeAvailable && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>QR code available after registration</span>
                </div>
              )}
              {event.bringValidId && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Bring valid ID to the event</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Ticket Modal */}
      {showQrModal && event && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Your Ticket</h2>
                    <p className="text-blue-100 text-sm">Present this QR code at the event</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseQrModal}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ticket Content */}
            <div className="p-6">
              {/* Event Info Card */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 mb-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 bg-white border-4 border-blue-100 rounded-xl p-4 mb-4 flex items-center justify-center shadow-inner">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-48 h-48 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    Scan this QR code at the event entrance
                  </p>
                </div>
              </div>

              {/* Ticket Code Section */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Ticket Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-mono font-semibold text-gray-900 text-center">
                    TKT-{event.id}-001
                  </div>
                  <button
                    onClick={handleCopyTicketCode}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    title="Copy ticket code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Copy</span>
                  </button>
                </div>
              </div>

              {/* Important Notice */}
              {event.bringValidId && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Important</p>
                      <p className="text-xs text-yellow-800">
                        Please arrive 15 minutes early. Bring a valid ID for verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseQrModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
