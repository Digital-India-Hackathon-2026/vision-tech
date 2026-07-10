import React, { useState } from 'react';
import { evaluateCandidate, getSavedReports, loginRecruiter, saveReport, signupRecruiter } from '../api';
import SkeletonLoader from '../components/Skeleton';

function RecruiterLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('githire_token'));
  const [activeTab, setActiveTab] = useState('evaluate');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await loginRecruiter(email, password);
      } else {
        result = await signupRecruiter(email, password, name);
      }
      localStorage.setItem('githire_token', result.token);
      setToken(result.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('githire_token');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="recruiter-layout">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="auth-container">
            <h2>{isLogin ? 'Recruiter Login' : 'Recruiter Sign Up'}</h2>
            <p>{isLogin ? 'Sign in to evaluate candidates' : 'Create an account to get started'}</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleAuth}>
              {!isLogin && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div className="auth-toggle">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-layout">
      <aside className="recruiter-sidebar">
        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'evaluate' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluate')}
          >
            <span>🔍</span> Candidate Search
          </button>
          <button
            className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span>📄</span> Saved Reports
          </button>
          <button
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span>⚙️</span> Settings
          </button>
          <button
            className={`sidebar-item ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <span>🆚</span> Compare
          </button>
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)', margin: '1rem' }}>
            <button
              className="sidebar-item"
              onClick={handleLogout}
              style={{ color: 'var(--danger)' }}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="recruiter-content">
        {activeTab === 'evaluate' && <CandidateEvaluation />}
        {activeTab === 'reports' && <SavedReports />}
        {activeTab === 'compare' && <CandidateComparison />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function CandidateEvaluation() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState(null);

  const handleEvaluate = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSaveState(null);
    try {
      const result = await evaluateCandidate(username.trim());
      setData(result);

      try {
        await saveReport({
          username: username.trim(),
          score: result.hireScore || result.score || 0,
          role: result.bestRole || result.careerLevel || 'Candidate',
          data: result,
        });
        setSaveState('Saved to reports');
      } catch (saveError) {
        setSaveState('Analysis completed, but saving the report failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate candidate');
    } finally {
      setLoading(false);
    }
  };

  const getHireRecommendation = (score) => {
    if (score >= 80) return { label: 'Strong Hire', color: 'var(--success)' };
    if (score >= 60) return { label: 'Hire', color: 'var(--info)' };
    if (score >= 40) return { label: 'Consider', color: 'var(--warning)' };
    return { label: 'Not Recommended', color: 'var(--danger)' };
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Candidate Evaluation</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Enter a GitHub username to evaluate a candidate using our engineering framework
      </p>

      <div className="evaluation-header">
        <input
          type="text"
          placeholder="GitHub username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEvaluate()}
        />
        <button className="btn-evaluate" onClick={handleEvaluate} disabled={loading || !username.trim()}>
          {loading ? 'Evaluating...' : 'Evaluate'}
        </button>
      </div>

      {loading && <SkeletonLoader type="candidate" />}

      {error && (
        <div className="auth-error" style={{ marginTop: '1rem' }}>{error}</div>
      )}

      {saveState && !error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.9rem 1rem',
          borderRadius: '12px',
          background: 'var(--bg-alt)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}>
          {saveState}
        </div>
      )}

      {data && (
        <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
          {/* Summary */}
          <div className="dashboard-card full-width">
            <div className="candidate-summary" style={{ margin: 0, padding: 0, background: 'transparent', border: 'none' }}>
              {data.profile?.avatar_url && (
                <img src={data.profile.avatar_url} alt={username} className="candidate-avatar" />
              )}
              <div className="candidate-info">
                <h2>{data.profile?.name || username}</h2>
                <div className="candidate-tags">
                  <span className="tag tag-primary">{data.careerLevel || 'Developer'}</span>
                  {data.bestRole && <span className="tag tag-success">{data.bestRole}</span>}
                  {data.experienceLevel && <span className="tag tag-warning">{data.experienceLevel}</span>}
                </div>
              </div>
              {data.hireScore != null && (
                <div className="candidate-score">
                  <div className="score-circle" style={{ '--score': `${data.hireScore}%` }}>
                    <span>{data.hireScore}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Hire Score</p>
                  {data.hireReason && <div className="score-reason">{data.hireReason}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Hire Recommendation */}
          {data.hireScore != null && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>📋 Hiring Recommendation</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 24px',
                  borderRadius: '50px',
                  background: `${getHireRecommendation(data.hireScore).color}20`,
                  border: `2px solid ${getHireRecommendation(data.hireScore).color}`,
                  color: getHireRecommendation(data.hireScore).color,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem',
                }}>
                  {getHireRecommendation(data.hireScore).label}
                </div>
                {data.engineeringScore != null && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Engineering Score: {data.engineeringScore}/100
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Engineering Score Breakdown */}
          {data.frameworkScores && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>📊 Evaluation Breakdown</h3>
              </div>
              <div className="practices-grid">
                {Object.entries(data.frameworkScores).map(([key, value]) => (
                  <div key={key} className="practice-item practice-item-stack">
                    <div className="practice-row">
                      <span className="practice-name">{key}</span>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: value >= 80 ? 'var(--success)' : value >= 50 ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {value}/100
                      </span>
                    </div>
                    {data.practiceReasons?.[key] && <p className="reason-copy compact">{data.practiceReasons[key]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repository Rankings */}
          {data.repositories && data.repositories.length > 0 && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>📂 Repository Rankings</h3>
              </div>
              <div className="repo-list">
                {data.repositories.map((repo, i) => (
                  <div key={i} className="repo-card">
                    <div className="repo-card-header">
                      <span className="repo-name">{repo.name}</span>
                      <span className="repo-score">{repo.score}/100</span>
                    </div>
                    {repo.technologies && repo.technologies.length > 0 && (
                      <div className="repo-techs">
                        {repo.technologies.slice(0, 4).map((tech, j) => (
                          <span key={j} className="repo-tech">{tech}</span>
                        ))}
                      </div>
                    )}
                    {repo.reason && <p className="reason-copy compact">{repo.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Questions */}
          {data.interviewQuestions && data.interviewQuestions.length > 0 && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>❓ Interview Questions</h3>
                <div className="card-icon" style={{ background: 'rgba(253,203,110,0.15)' }}>📝</div>
              </div>
              <div className="interview-questions">
                {data.interviewQuestions.map((q, i) => (
                  <div key={i} className="interview-q">
                    <div className="q-repo">{q.repository}</div>
                    <div className="q-text">{q.question}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SavedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSavedReports();
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadReports();
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Saved Reports</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        View and manage your saved candidate evaluation reports
      </p>
      {loading ? (
        <SkeletonLoader type="candidate" />
      ) : error ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Unable to load reports</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
          <button className="btn-cta" onClick={loadReports}>Retry</button>
        </div>
      ) : reports.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3>No Saved Reports</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Evaluated candidates will appear here once you save them
          </p>
          <button className="btn-cta" onClick={loadReports} style={{ marginTop: '1rem' }}>
            Refresh
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn-cta" onClick={loadReports}>Refresh Reports</button>
          </div>
          <div className="repo-list">
            {reports.map((report) => (
              <div key={report._id || `${report.username}-${report.createdAt}`} className="repo-card">
                <div className="repo-card-header">
                  <span className="repo-name">{report.username}</span>
                  <span className="repo-score">{report.score || 0}/100</span>
                </div>
                <div className="repo-meta">
                  <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently saved'}</span>
                  <span>{report.role || 'Candidate Review'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateComparison() {
  const [leftUsername, setLeftUsername] = useState('');
  const [rightUsername, setRightUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);

  const handleCompare = async () => {
    if (!leftUsername.trim() || !rightUsername.trim()) return;
    setLoading(true);
    setError(null);
    setLeftData(null);
    setRightData(null);

    try {
      const [leftResult, rightResult] = await Promise.all([
        evaluateCandidate(leftUsername.trim()),
        evaluateCandidate(rightUsername.trim()),
      ]);
      setLeftData(leftResult);
      setRightData(rightResult);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare candidates');
    } finally {
      setLoading(false);
    }
  };

  const renderComparisonCard = (title, data, username) => {
    if (!data) return null;

    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="comparison-summary">
          <h4>{data.profile?.name || username}</h4>
          <div className="comparison-metrics">
            <div>
              <span className="comparison-metric-label">Hire Score</span>
              <strong>{data.hireScore ?? 'N/A'}</strong>
            </div>
            <div>
              <span className="comparison-metric-label">Engineering</span>
              <strong>{data.engineeringScore ?? 'N/A'}</strong>
            </div>
            <div>
              <span className="comparison-metric-label">Best Role</span>
              <strong>{data.bestRole || 'N/A'}</strong>
            </div>
          </div>
          {data.hireReason && <p className="reason-copy">{data.hireReason}</p>}
          {data.repositories && data.repositories.length > 0 && (
            <div className="repo-list" style={{ marginTop: '1rem' }}>
              {data.repositories.slice(0, 3).map((repo) => (
                <div key={repo.name} className="repo-card">
                  <div className="repo-card-header">
                    <span className="repo-name">{repo.name}</span>
                    <span className="repo-score">{repo.score}/100</span>
                  </div>
                  {repo.reason && <p className="reason-copy compact">{repo.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Candidate Comparison</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Compare two candidates side-by-side using the recruiter framework
      </p>

      <div className="comparison-form">
        <input type="text" placeholder="First GitHub username..." value={leftUsername} onChange={(e) => setLeftUsername(e.target.value)} />
        <input type="text" placeholder="Second GitHub username..." value={rightUsername} onChange={(e) => setRightUsername(e.target.value)} />
        <button className="btn-evaluate" onClick={handleCompare} disabled={loading || !leftUsername.trim() || !rightUsername.trim()}>
          {loading ? 'Comparing...' : 'Compare Candidates'}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {loading && <SkeletonLoader type="candidate" />}

      {(leftData || rightData) && (
        <div className="comparison-grid">
          {renderComparisonCard('Candidate A', leftData, leftUsername.trim())}
          {renderComparisonCard('Candidate B', rightData, rightUsername.trim())}
        </div>
      )}
    </div>
  );
}

function Settings() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Settings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Manage your account settings
      </p>
      <div className="dashboard-card" style={{ maxWidth: '500px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Account Information</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Account management features will be available in a future update.
        </p>
      </div>
    </div>
  );
}

export default RecruiterLogin;