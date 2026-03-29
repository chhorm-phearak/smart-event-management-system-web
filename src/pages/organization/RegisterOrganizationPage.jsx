import { useState, useEffect, useCallback, useRef } from 'react';
import { organizationService } from '@/services';

const createEmptyFormData = () => ({
  org_name: '',
  org_type: '',
  contact: '',
  email: '',
  description: '',
});

const normalizeStatus = (status) => {
  if (!status) return 'unknown';
  const upper = status.toString().toUpperCase();
  switch (upper) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'approved';
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
      return 'rejected';
    default:
      return upper.toLowerCase();
  }
};

export const RegisterOrganizationPage = () => {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState(() => createEmptyFormData());
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const isMountedRef = useRef(true);

  const fetchOrganizationStatus = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setLoading(true);
    setErrors(prev => {
      if (!prev.submit) return prev;
      const { submit, ...rest } = prev;
      return rest;
    });

    try {
      const response = await organizationService.getCurrentOrganization();
      if (!isMountedRef.current) return;

      const payload = response?.data;
      if (payload?.data) {
        const { source, status, data: orgData } = payload;
        const normalizedStatus = normalizeStatus(status ?? orgData?.status);
        const normalizedOrganization = {
          ...orgData,
          source,
          status: normalizedStatus,
          rawStatus: status ?? orgData?.status,
          submittedDate: orgData?.created_at,
        };

        setOrganization(normalizedOrganization);
        setFormData({
          org_name: orgData?.org_name ?? '',
          org_type: orgData?.org_type ?? '',
          contact: orgData?.contact ?? '',
          email: orgData?.email ?? '',
          description: orgData?.description ?? '',
        });
      } else {
        setOrganization(null);
        setFormData(createEmptyFormData());
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error.response?.status === 404) {
        setOrganization(null);
        setFormData(createEmptyFormData());
      } else {
        console.error('Error fetching organization status:', error);
        setErrors(prev => ({
          ...prev,
          submit: error.response?.data?.message || 'Failed to load organization status. Please try again.',
        }));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrganizationStatus();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchOrganizationStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.org_name.trim()) {
      newErrors.org_name = 'Organization name is required';
    }
    if (!formData.org_type.trim()) {
      newErrors.org_type = 'Organization type is required';
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccess(null);
      setErrors({});

      const payload = {
        org_name: formData.org_name.trim(),
        org_type: formData.org_type.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
      };

      const response = await organizationService.submitOrganizationApplication(payload);

      setSuccess(response?.message || 'Organization registration submitted successfully!');
      await fetchOrganizationStatus();
    } catch (error) {
      console.error('Error registering organization:', error);
      const errorResponse = error.response?.data;
      const fieldErrors = errorResponse?.errors;

      if (fieldErrors && typeof fieldErrors === 'object') {
        setErrors(fieldErrors);
      } else {
        setErrors({ submit: errorResponse?.message || 'Failed to submit registration. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'pending':
      case 'rejected':
        return {
          approved: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          rejected: 'bg-red-100 text-red-800'
        }[status];
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const isApproved = organization?.status === 'approved';
  const isPending = organization?.status === 'pending';

  if (loading && !organization) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Registration</h1>
            <p className="text-gray-600">Manage your organization registration and view application status</p>
          </div>
          {organization && (
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(organization.status)}`}>
              {getStatusLabel(organization.status)}
            </span>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {organization && organization.status === 'pending' && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Application Under Review</h3>
              <p className="text-gray-700">
                Your application is currently being reviewed by an administrator. You will be notified via email once a decision has been made.
              </p>
              {organization.submittedDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Submitted on {new Date(organization.submittedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          )}
          {errors.submit && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{errors.submit}</span>
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization name *
            </label>
            <input
              type="text"
              name="org_name"
              value={formData.org_name}
              onChange={handleChange}
              disabled={isApproved}
              placeholder="Enter your organization name"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.org_name ? 'border-red-300' : 'border-gray-300'
              } ${isApproved ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {errors.org_name && (
              <p className="mt-1 text-sm text-red-600">{errors.org_name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization type *
            </label>
            <input
              type="text"
              name="org_type"
              value={formData.org_type}
              onChange={handleChange}
              disabled={isApproved}
              placeholder="e.g., EDUCATION, TECHNOLOGY, NON_PROFIT"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.org_type ? 'border-red-300' : 'border-gray-300'
              } ${isApproved ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {errors.org_type && (
              <p className="mt-1 text-sm text-red-600">{errors.org_type}</p>
            )}
          </div>

          {/* Contact and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact *
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                disabled={isApproved}
                placeholder="+85512345678"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.contact ? 'border-red-300' : 'border-gray-300'
                } ${isApproved ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {errors.contact && (
                <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isApproved}
                placeholder="contact@organization.org"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } ${isApproved ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isApproved}
              rows={5}
              placeholder="Describe your organization, its mission, and what types of events you organize..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } ${isApproved ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Submission Date */}
          {organization && organization.submittedDate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Submitted:</span>{' '}
                {new Date(organization.submittedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Submit Button */}
          {!isApproved && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{organization ? 'Update Application' : 'Submit Application'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
