import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService, uploadSingle } from '@/services';
import { Upload, X, Camera } from 'lucide-react';

export const ProfilePage = () => {
  const { user: authUser, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    contact: '',
    address: '',
    date_of_birth: '',
    img_url: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.getProfile();
      const userData = response.data?.user || {};
      
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        gender: userData.gender || '',
        contact: userData.contact || '',
        address: userData.address || '',
        date_of_birth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
        img_url: userData.img_url || '',
      });
      
      // Set image preview if user has an existing image
      if (userData.img_url) {
        setImagePreview(userData.img_url);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, img_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        email: formData.email || null,
        gender: formData.gender || null,
        contact: formData.contact || null,
        address: formData.address || null,
        date_of_birth: formData.date_of_birth || null,
        img_url: formData.img_url || null,
      };

      // If there's a new image file, upload it first
      if (imageFile) {
        try {
          const uploadResponse = await uploadSingle(imageFile);
          const fileUrl = uploadResponse?.data?.file?.file_url;
          if (fileUrl) {
            // Handle both full URLs and relative paths
            updateData.img_url = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      const response = await authService.updateProfile(updateData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        // Merge with existing auth user so fields not returned by the update
        // endpoint (e.g. organization_id, role) are preserved.
        setUser({ ...(authUser || {}), ...updatedUser });
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfile(); // Reset form data
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-blue-100">Manage your personal information and account settings</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        {/* Profile Image Section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="relative">
            {formData.img_url ? (
              <img
                src={formData.img_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                {formData.first_name?.[0] || formData.email?.[0] || 'U'}
              </div>
            )}
            {isEditing && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {formData.first_name && formData.last_name
                ? `${formData.first_name} ${formData.last_name}`
                : formData.first_name || formData.email || 'User'}
            </h2>
            <p className="text-gray-600 mb-2">{formData.email}</p>
            {isEditing && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  {/* Image Upload Area */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {imageFile ? imageFile.name : 'Choose image or drag and drop'}
                        </span>
                      </label>
                    </div>
                    {imageFile && (
                      <p className="mt-2 text-xs text-gray-500">
                        File size: {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  
                  {/* Remove Image Button */}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                      />
                      <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Email cannot be changed
            </p>
          </div>

          {/* Gender and Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+1234567890"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              placeholder="Enter your address"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </form>

        {/* Read-only Info Section */}
        {!isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ACTIVE
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="text-gray-900 font-semibold">
                  {authUser?.role
                    ? (authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1).toLowerCase())
                    : (authUser?.organization_id || authUser?.organizationId || authUser?.organization?.id
                      ? 'Organizer'
                      : 'User')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


