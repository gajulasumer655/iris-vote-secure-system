
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Shield, Vote, BarChart3 } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/register', label: 'User Registration', icon: Users },
    { path: '/admin', label: 'Admin Dashboard', icon: Shield },
    { path: '/vote', label: 'Vote Casting', icon: Vote },
    { path: '/results', label: 'Results', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-blue-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Vote className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Smart Voting System</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
