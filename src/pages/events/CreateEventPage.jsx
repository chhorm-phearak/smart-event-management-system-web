import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, staffService } from '@/services';

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    fullAddress: '',
    category: '',
    capacity: 400,
    duration: 0,
    image: null,
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Technology',
    'Business',
    'Education',
    'Entertainment',
    'Sports',
    'Health',
    'Arts',
    'Other',
  ];

  useEffect(() => {
    fetchStaff();
    // Calculate duration when start and end times change
    if (formData.startTime && formData.endTime && formData.eventDate) {
      calculateDuration();
    }
  }, [formData.startTime, formData.endTime, formData.eventDate]);

  const fetchStaff = async () => {
    try {
      // Mock staff data - replace with actual API call
      // const data = await staffService.getAllStaff();
      const mockStaff = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Event Manager' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Coordinator' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Support Staff' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Event Manager' },
        { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Coordinator' },
      ];
      setStaffList(mockStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime && formData.eventDate) {
      const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      
      if (endDateTime > startDateTime) {
        const diffMs = endDateTime - startDateTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        setFormData((prev) => ({ ...prev, duration: diffMinutes }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const handleStaffToggle = (staff) => {
    setSelectedStaff((prev) => {
      const isSelected = prev.some((s) => s.id === staff.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== staff.id);
      } else {
        return [...prev, staff];
      }
    });
  };

  const handleAddAgenda = () => {
    setAgendas((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        speaker: '',
      },
    ]);
  };

  const handleUpdateAgenda = (id, field, value) => {
    setAgendas((prev) =>
      prev.map((agenda) =>
        agenda.id === id ? { ...agenda, [field]: value } : agenda
      )
    );
  };

  const handleRemoveAgenda = (id) => {
    setAgendas((prev) => prev.filter((agenda) => agenda.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (formData.title.length > 150) newErrors.title = 'Title must be 150 characters or less';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.description.trim()) newErrors.description = 'Full description is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.fullAddress.trim()) newErrors.fullAddress = 'Full address is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.capacity || formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';

    // Validate time logic
    if (formData.startTime && formData.endTime && formData.eventDate) {
      const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      
      // Combine date and time for start_time and end_time
      const startDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      submitData.append('start_time', startDateTime.toISOString());
      submitData.append('end_time', endDateTime.toISOString());
      submitData.append('duration', formData.duration);
      
      submitData.append('location', formData.location);
      submitData.append('fullAddress', formData.fullAddress);
      submitData.append('category', formData.category);
      submitData.append('capacity', formData.capacity);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      if (selectedStaff.length > 0) {
        submitData.append('staffIds', JSON.stringify(selectedStaff.map((s) => s.id)));
      }
      
      if (agendas.length > 0) {
        submitData.append('agendas', JSON.stringify(agendas));
      }

      // Uncomment when backend is ready
      // await eventService.createEvent(submitData);
      
      // For now, just log and navigate
      console.log('Event data:', {
        ...formData,
        staffIds: selectedStaff.map((s) => s.id),
        agendas,
      });

      // Navigate to dashboard after successful creation
      navigate('/');
    } catch (error) {
      console.error('Error creating event:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Page Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600">Fill in the details to create and publish your event.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>

          <div className="space-y-4">
            {/* Event Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Title of your event"
                maxLength={150}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                <p className="text-sm text-gray-500 ml-auto">{formData.title.length}/150</p>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Short Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Short Description of your event"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.shortDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.shortDescription}</p>
              )}
            </div>

            {/* Full Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Full Description of your event..."
                rows={5}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Event Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Image
              </label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="w-full h-64 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {errors.image && <p className="text-sm text-red-500 mt-1">{errors.image}</p>}
            </div>
          </div>
        </div>

        {/* Assign Staff Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Staffs</h2>
          {selectedStaff.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedStaff.map((staff) => (
                <span
                  key={staff.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {staff.name}
                  <button
                    type="button"
                    onClick={() => handleStaffToggle(staff)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Assign Staffs to support your event</span>
          </button>
        </div>

        {/* Event Date and Time Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Date and Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event Date */}
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                Event Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    errors.eventDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              {errors.eventDate && <p className="text-sm text-red-500 mt-1">{errors.eventDate}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>}
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>}
              {formData.duration > 0 && (
                <p className="text-sm text-gray-500 mt-1">Duration: {formData.duration} minutes</p>
              )}
            </div>
          </div>
        </div>

        {/* Location and Capacity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location and Capacity</h2>
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Phnom Penh, Kandal,..."
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
            </div>

            {/* Full Address */}
            <div>
              <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Full Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="fullAddress"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  placeholder="Input your full address or select from the map"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 ${
                    errors.fullAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>
              {errors.fullAddress && <p className="text-sm text-red-500 mt-1">{errors.fullAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.capacity && <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Create Agendas Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Agendas</h2>
          {agendas.length > 0 && (
            <div className="space-y-3 mb-4">
              {agendas.map((agenda) => (
                <div key={agenda.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Agenda Item {agendas.indexOf(agenda) + 1}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveAgenda(agenda.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Agenda Title"
                      value={agenda.title}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <textarea
                      placeholder="Agenda Description"
                      value={agenda.description}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        placeholder="Start Time"
                        value={agenda.startTime}
                        onChange={(e) => handleUpdateAgenda(agenda.id, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="time"
                        placeholder="End Time"
                        value={agenda.endTime}
                        onChange={(e) => handleUpdateAgenda(agenda.id, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Speaker (optional)"
                      value={agenda.speaker}
                      onChange={(e) => handleUpdateAgenda(agenda.id, 'speaker', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleAddAgenda}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Create agenda for your event</span>
          </button>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>

      {/* Staff Selection Modal */}
      {showStaffModal && (
        <StaffSelectionModal
          staffList={staffList}
          selectedStaff={selectedStaff}
          onToggle={handleStaffToggle}
          onClose={() => setShowStaffModal(false)}
          onConfirm={() => setShowStaffModal(false)}
        />
      )}
    </div>
  );
};

// Staff Selection Modal Component
const StaffSelectionModal = ({ staffList, selectedStaff, onToggle, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Select Staff Members</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {staffList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No staff members available</p>
          ) : (
            <div className="space-y-3">
              {staffList.map((staff) => {
                const isSelected = selectedStaff.some((s) => s.id === staff.id);
                return (
                  <label
                    key={staff.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(staff)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-sm text-gray-500">{staff.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{staff.role}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm ({selectedStaff.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
};
