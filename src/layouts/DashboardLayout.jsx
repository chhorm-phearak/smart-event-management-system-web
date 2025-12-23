import { Outlet, Link, NavLink } from 'react-router-dom';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Event Management
              </Link>
              <div className="flex space-x-4">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 underline'
                        : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/events"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 underline'
                        : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  Events
                </NavLink>
                <NavLink
                  to="/groups"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 underline'
                        : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  Groups
                </NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

