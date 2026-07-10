import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

const Landing = lazy(() => import('./pages/Landing'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={
          <div className="page-loader">
            <div className="loader-spinner"></div>
            <p>Loading...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard/:username" element={<StudentDashboard />} />
            <Route path="/recruiter/*" element={<RecruiterDashboard />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;