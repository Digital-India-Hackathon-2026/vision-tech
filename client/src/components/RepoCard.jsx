import React from 'react';

function RepoCard({ repo }) {
  const getComplexityLabel = (complexity) => {
    if (complexity >= 8) return 'High';
    if (complexity >= 5) return 'Medium';
    return 'Low';
  };

  const getRatingClass = (rating) => {
    if (rating >= 8) return 'tag-success';
    if (rating >= 5) return 'tag-warning';
    return 'tag-primary';
  };

  return (
    <div className="repo-card">
      <div className="repo-card-header">
        <span className="repo-name">{repo.name}</span>
        <span className="repo-score">{repo.score}/100</span>
      </div>
      {repo.technologies && repo.technologies.length > 0 && (
        <div className="repo-techs">
          {repo.technologies.slice(0, 5).map((tech, i) => (
            <span key={i} className="repo-tech">{tech}</span>
          ))}
        </div>
      )}
      <div className="repo-meta">
        <span>Complexity: {getComplexityLabel(repo.complexity || 0)}</span>
        <span>
          Rating: <span className={`tag ${getRatingClass(repo.engineeringRating || 0)}`} style={{ padding: '1px 6px', fontSize: '0.75rem' }}>
            {repo.engineeringRating || 'N/A'}/10
          </span>
        </span>
      </div>
    </div>
  );
}

export default RepoCard;