import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Small delay to ensure token is stored
        setTimeout(() => {
          const token = localStorage.getItem('accessToken');
          if (token) {
            navigate('/', { replace: true });
          } else {
            // Still navigate if login was successful (token might be in cookie)
            console.warn('No token in localStorage, but login was successful. Navigating anyway.');
            navigate('/', { replace: true });
          }
        }, 50);
      } else {
        setError(result.error || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left Section - Decorative */}
      <div className="hidden lg:flex lg:w-2/3 bg-white items-center justify-center relative">
        <div className="text-left absolute top-8 left-8 text-blue-600 font-semibold text-lg">
          Attendee-1-blue
        </div>
        <div className="w-96 h-96 rounded-full border-4 border-blue-500 bg-orange-200 flex items-center justify-center">
          {/* Decorative circle */}
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back to home link */}
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-800 mb-6 inline-block text-sm"
          >
            ← Back to home
          </Link>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-6">Choose your role and sign in to continue</p>

            {/* Sign In / Sign Up Tabs */}
            <div className="flex gap-2 mb-6">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium">
                Sign In
              </button>
              <Link
                to="/register"
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-center hover:bg-gray-300 transition"
              >
                Sign Up
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

