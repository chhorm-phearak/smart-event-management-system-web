import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const MyTicketPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockTickets = [
        {
          id: 1,
          eventId: 1,
          title: 'Tech Conference 2024',
          category: 'Technology',
          date: '2024-03-15',
          time: '09:00',
          location: 'Convention Center, New York',
          fullAddress: '123 Main Street, New York',
          registrationDate: '2024-02-10',
          price: 0,
          status: 'active',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
          qrCode: 'TKT-2024-001',
          organizer: 'Tech Events Inc.'
        },
        {
          id: 2,
          eventId: 2,
          title: 'AI & Machine Learning Summit',
          category: 'Technology',
          date: '2024-04-20',
          time: '10:00',
          location: 'Tech Hub, San Francisco',
          fullAddress: '456 Innovation Drive, San Francisco',
          registrationDate: '2024-03-15',
          price: 299,
          status: 'active',
          image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
          qrCode: 'TKT-2024-002',
          organizer: 'AI Institute'
        },
        {
          id: 3,
          eventId: 3,
          title: 'Web Development Workshop',
          category: 'Education',
          date: '2024-05-10',
          time: '14:00',
          location: 'Online',
          fullAddress: 'Virtual Event',
          registrationDate: '2024-04-01',
          price: 99,
          status: 'active',
          image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
          qrCode: 'TKT-2024-003',
          organizer: 'Code Academy'
        },
        {
          id: 4,
          eventId: 4,
          title: 'Startup Networking Night',
          category: 'Business',
          date: '2024-06-15',
          time: '18:00',
          location: 'Business Center, Boston',
          fullAddress: '789 Commerce Street, Boston',
          registrationDate: '2024-05-20',
          price: 0,
          status: 'active',
          image: 'https://images.unsplash.com/photo-1515189828136-35d2523c5b06?w=400&h=200&fit=crop',
          qrCode: 'TKT-2024-004',
          organizer: 'Startup Hub'
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleViewEvent = (eventId) => {
    navigate(`/my-ticket/detail/${eventId}`);
  };

  const handleShowQrTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowQrModal(true);
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setSelectedTicket(null);
  };

  const handleCopyTicketCode = () => {
    if (selectedTicket) {
      navigator.clipboard.writeText(selectedTicket.qrCode);
      // You could add a toast notification here
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    
    const matchesDate = selectedDate === 'all' || 
                       (selectedDate === 'upcoming' && new Date(ticket.date) > new Date()) ||
                       (selectedDate === 'past' && new Date(ticket.date) <= new Date());
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const categories = ['all', ...new Set(tickets.map(ticket => ticket.category))];

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
            <h1 className="text-3xl font-bold text-gray-900">My Ticket</h1>
            <p className="text-gray-600 mt-1">View and manage your event tickets</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{tickets.length} tickets</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2">
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

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Category</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Date</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchMyTickets}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Event Image */}
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={ticket.image} 
                  alt={ticket.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
                    {ticket.category}
                  </span>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{ticket.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(ticket.date)} at {formatTime(ticket.time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{ticket.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Registered on {formatDate(ticket.registrationDate)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewEvent(ticket.eventId)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Event
                  </button>
                  <button
                    onClick={() => handleShowQrTicket(ticket)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Show QR Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Ticket Modal */}
      {showQrModal && selectedTicket && (
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTicket.title}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(selectedTicket.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{formatTime(selectedTicket.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{selectedTicket.location}</span>
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
                    {selectedTicket.qrCode}
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

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseQrModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => console.log('Downloading QR ticket...')}
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

