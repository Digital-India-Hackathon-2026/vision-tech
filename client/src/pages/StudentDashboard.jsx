import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { analyzeGithub, matchJobDescription } from '../api';
import SkeletonLoader from '../components/Skeleton';
import RepoCard from '../components/RepoCard';

const PROGRESS_MESSAGES = [
  'Fetching repositories...',
  'Extracting technologies...',
  'Analyzing engineering practices...',
  'Ranking repositories...',
  'Generating AI insights...',
  'Matching job description...',
];

function StudentDashboard() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyzeGithub(username);
      setData(result);
    } catch (err) {
      console.error('Analysis error:', err);
      const msg = err.response?.data?.message || err.message || 'Analysis failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleJobMatch = async () => {
    if (!jobDescription.trim()) return;
    try {
      setMatchLoading(true);
      const result = await matchJobDescription(username, jobDescription);
      setMatchResult(result);
    } catch (err) {
      setMatchResult({ error: err.response?.data?.message || 'Failed to match job description' });
    } finally {
      setMatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="progress-messages">
          <p className="progress-message">{PROGRESS_MESSAGES[progressIndex]}</p>
        </div>
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-card full-width" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2>Analysis Failed</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>{error}</p>
          <button className="btn-cta" onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, score, scoreReason, careerLevel, bestRole, repoCount, feedback, technologies, repositories, practices, practiceReasons, traits } = data;

  return (
    <div className="dashboard">
      {/* Candidate Summary */}
      {profile && (
        <div className="candidate-summary">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt={username} className="candidate-avatar" />
          )}
          <div className="candidate-info">
            <h2>{profile.name || username}</h2>
            <div className="candidate-tags">
              {careerLevel && <span className="tag tag-primary">{careerLevel}</span>}
              {bestRole && <span className="tag tag-success">{bestRole}</span>}
              <span className="tag tag-warning">{repoCount || profile.public_repos || 0} repos</span>
            </div>
          </div>
          {score != null && (
            <div className="candidate-score">
              <div className="score-circle" style={{ '--score': `${score}%` }}>
                <span>{score}</span>
              </div>
              <p>Overall Score</p>
              {scoreReason && <div className="score-reason">{scoreReason}</div>}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-grid">
        {/* AI Feedback */}
        {feedback && (
          <div className="dashboard-card full-width">
            <div className="card-header">
              <h3>🤖 AI Feedback</h3>
            </div>
            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="feedback-section">
                <h4 style={{ color: 'var(--success)' }}>✅ Strengths</h4>
                <div className="feedback-list">
                  {feedback.strengths.map((s, i) => (
                    <div key={i} className="feedback-item">
                      <span className="feedback-dot" style={{ background: 'var(--success)' }}></span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {feedback.weaknesses && feedback.weaknesses.length > 0 && (
              <div className="feedback-section">
                <h4 style={{ color: 'var(--warning)' }}>⚠️ Areas to Improve</h4>
                <div className="feedback-list">
                  {feedback.weaknesses.map((w, i) => (
                    <div key={i} className="feedback-item">
                      <span className="feedback-dot" style={{ background: 'var(--warning)' }}></span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="feedback-section">
                <h4 style={{ color: 'var(--info)' }}>💡 Career Suggestions</h4>
                <div className="feedback-list">
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} className="feedback-item">
                      <span className="feedback-dot" style={{ background: 'var(--info)' }}></span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {scoreReason && (
              <div className="feedback-section">
                <h4 style={{ color: 'var(--text-secondary)' }}>Why this score?</h4>
                <p className="reason-copy">{scoreReason}</p>
              </div>
            )}
          </div>
        )}

        {/* Technology Analysis */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>💻 Technology Analysis</h3>
            <div className="card-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🔧</div>
          </div>
          {technologies && technologies.length > 0 ? (
            <table className="tech-table">
              <thead>
                <tr>
                  <th>Technology</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {technologies.map((tech, i) => (
                  <tr key={i}>
                    <td>{tech.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="confidence-bar">
                          <div className="confidence-fill" style={{ width: `${tech.confidence}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{tech.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No technologies detected</p>
          )}
        </div>

        {/* Repository Ranking */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>📊 Repository Ranking</h3>
            <div className="card-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🏆</div>
          </div>
          {repositories && repositories.length > 0 ? (
            <div className="repo-list">
              {repositories.map((repo, i) => (
                <RepoCard key={i} repo={repo} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No repositories found</p>
          )}
        </div>

        {/* Engineering Practices */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🔧 Engineering Practices</h3>
            <div className="card-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>⚙️</div>
          </div>
          {practices && Object.keys(practices).length > 0 ? (
            <div className="practices-grid">
              {Object.entries(practices).map(([key, value]) => (
                <div key={key} className="practice-item practice-item-stack">
                  <div className="practice-row">
                    <span className="practice-name">{key}</span>
                    <span className={`practice-status ${value === 'Excellent' ? 'excellent' : value === 'Good' ? 'good' : 'needs-improvement'}`}>
                      {value}
                    </span>
                  </div>
                  {practiceReasons?.[key] && <p className="reason-copy compact">{practiceReasons[key]}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No practices evaluated</p>
          )}
        </div>

        {/* Developer Profile */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>👤 Developer Profile</h3>
            <div className="card-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🎭</div>
          </div>
          {traits && traits.length > 0 ? (
            <div className="profile-traits">
              {traits.map((trait, i) => (
                <span key={i} className="trait">{trait}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No profile traits available</p>
          )}
        </div>

        {/* Job Description Matching */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3>🎯 Job Description Matching</h3>
            <div className="card-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>📋</div>
          </div>
          <div className="job-match-section">
            <textarea
              placeholder="Paste a job description here to see how your skills match..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
              className="btn-match"
              onClick={handleJobMatch}
              disabled={matchLoading || !jobDescription.trim()}
            >
              {matchLoading ? 'Analyzing...' : 'Match Skills'}
            </button>
            {matchResult && (
              <div className="match-result">
                {matchResult.error ? (
                  <p style={{ color: 'var(--danger)' }}>{matchResult.error}</p>
                ) : (
                  <>
                    {matchResult.matchPercentage !== undefined && (
                      <>
                        <div className="match-percentage">{matchResult.matchPercentage}%</div>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          Job Match
                        </p>
                        {matchResult.matchReason && <p className="reason-copy center">{matchResult.matchReason}</p>}
                      </>
                    )}
                    <div className="match-skills-grid">
                      <div className="match-skills">
                        <h4>✅ Strong Skills</h4>
                        <div>
                          {(matchResult.strongSkills || []).map((skill, i) => (
                            <span key={i} className="match-skill strong">{skill}</span>
                          ))}
                          {(!matchResult.strongSkills || matchResult.strongSkills.length === 0) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None listed</span>
                          )}
                        </div>
                      </div>
                      <div className="match-skills">
                        <h4>❌ Missing Skills</h4>
                        <div>
                          {(matchResult.missingSkills || []).map((skill, i) => (
                            <span key={i} className="match-skill missing">{skill}</span>
                          ))}
                          {(!matchResult.missingSkills || matchResult.missingSkills.length === 0) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;