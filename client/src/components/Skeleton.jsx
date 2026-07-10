import React from 'react';

function SkeletonLoader({ type = 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div className="skeleton-container">
        <div className="skeleton skeleton-card"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-chart"></div>
        <div className="skeleton skeleton-text short"></div>
        <div className="skeleton skeleton-card"></div>
      </div>
    );
  }

  if (type === 'candidate') {
    return (
      <div className="skeleton-container">
        <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-card" style={{ height: '150px' }}></div>
      </div>
    );
  }

  return (
    <div className="skeleton-container">
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
    </div>
  );
}

export default SkeletonLoader;