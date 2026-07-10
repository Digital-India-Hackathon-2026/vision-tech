import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

const Landing = lazy(() => import('./pages/Landing'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dashboard">
          <div className="dashboard-card full-width" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>
              Reload the page or try again in a moment.
            </p>
            <button className="btn-cta" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <AppErrorBoundary>
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
        </AppErrorBoundary>
      </main>
    </div>
  );
}

export default App;