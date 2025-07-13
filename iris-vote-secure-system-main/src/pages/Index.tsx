
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import UserRegistration from '../components/UserRegistration';
import AdminDashboard from '../components/AdminDashboard';
import VoteCasting from '../components/VoteCasting';
import Results from '../components/Results';
import { VotingProvider } from '../context/VotingContext';

const Index = () => {
  return (
    <VotingProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/vote" element={<VoteCasting />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>
      </div>
    </VotingProvider>
  );
};

export default Index;
