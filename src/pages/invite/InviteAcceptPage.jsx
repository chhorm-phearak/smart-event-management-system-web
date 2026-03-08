import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export const InviteAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/invite/validate/${token}`);
      setInviteData(response.data.data);
      
    } catch (error) {
      console.error('Invite validation failed:', error);
      
      // If 401 (unauthorized), don't show error - just let user login
      if (error.response?.status === 401) {
        // User needs to login first - don't set error, let handleJoinGroup handle it
        setLoading(false);
        return;
      }
      
      setError(error.response?.data?.message || error.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) {
      // Store the current invite URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      
      const response = await api.post(`/invite/accept/${token}`);
      
      setJoined(true);
      alert('Successfully joined the group!');
      
      // Navigate to the group page after successful join
      setTimeout(() => {
        navigate(`/groups/${response.data.data.group.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to join group:', error);
      setError(error.response?.data?.message || error.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleViewGroup = () => {
    if (inviteData?.group?.id) {
      navigate(`/groups/${inviteData.group.id}`);
    }
  };

  // Show join button if we have invite data OR if user needs to login (401 case)
  const showJoinButton = inviteData || (!loading && !error && !user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invite link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invite Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Joined!</h2>
          <p className="text-gray-600 mb-6">You have successfully joined the group. Redirecting to group page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Group Invitation</h1>
          <p className="text-gray-600">You've been invited to join a group</p>
        </div>

        {/* Group Info */}
        {!inviteData && !user && !loading && !error && (
          <div className="mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="font-semibold text-amber-800">Login Required</h3>
              </div>
              <p className="text-sm text-amber-700">
                Please login to view and accept this group invitation.
              </p>
            </div>
          </div>
        )}

        {inviteData && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">{inviteData.group.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{inviteData.group.description}</p>
              
              {inviteData.group.organization_name && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{inviteData.group.organization_name}</span>
                </div>
              )}

              {/* Invite Message */}
              {inviteData.inviteLink.message && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-sm text-blue-700 italic">"{inviteData.inviteLink.message}"</p>
                </div>
              )}

              {/* Creator Info */}
              {inviteData.creator && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>
                      Invited by {inviteData.creator.first_name} {inviteData.creator.last_name}
                      {inviteData.creator.email && ` (${inviteData.creator.email})`}
                    </span>
                  </div>
                </div>
              )}

              {/* Invite Link Info */}
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Uses: {inviteData.inviteLink.current_uses}/{inviteData.inviteLink.max_uses || 'Unlimited'}</span>
                  <span>
                    Expires: {inviteData.inviteLink.expires_at 
                      ? new Date(inviteData.inviteLink.expires_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {showJoinButton && !joined ? (
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{user ? 'Join Group' : 'Login to Join Group'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleViewGroup}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>View Group</span>
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
