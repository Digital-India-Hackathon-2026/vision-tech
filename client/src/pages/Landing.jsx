import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function extractUsername(input) {
  const trimmed = input.trim();
  // If it's a GitHub URL like https://github.com/username
  const urlMatch = trimmed.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1];
  // If it's already a username
  if (/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(trimmed)) return trimmed;
  return null;
}

function Landing() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e) => {
    e.preventDefault();
    setError('');
    const username = extractUsername(input);
    if (!username) {
      setError('Enter a valid GitHub username or URL (e.g., HAREESSHP or https://github.com/HAREESSHP)');
      return;
    }
    navigate(`/dashboard/${username}`);
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>⚡</span> AI-Powered Career Intelligence
          </div>
          <h1>Transform Your GitHub Into Career Intelligence</h1>
          <p>
            AI analyzes your repositories and provides engineering insights,
            career guidance, and job matching to help you land your dream role.
          </p>
          <form className="hero-search" onSubmit={handleAnalyze}>
            <input
              type="text"
              placeholder="GitHub username or profile URL..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>
              Analyze Profile
            </button>
          </form>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              {error}
            </p>
          )}
          <div className="hero-stats">
            <div className="hero-stat">
              <h3>10K+</h3>
              <p>Profiles Analyzed</p>
            </div>
            <div className="hero-stat">
              <h3>95%</h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="hero-stat">
              <h3>50+</h3>
              <p>Companies Using</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">
          Everything you need to understand and improve your GitHub presence
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🤖</div>
            <h3>AI Feedback</h3>
            <p>Get personalized AI-powered feedback on your repositories and coding practices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>📊</div>
            <h3>Repository Ranking</h3>
            <p>Every repository scored and ranked based on quality, complexity, and engineering practices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🔧</div>
            <h3>Engineering Analysis</h3>
            <p>Evaluate authentication, APIs, architecture, testing, documentation, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>💻</div>
            <h3>Tech Stack Analysis</h3>
            <p>Identify your strongest technologies with confidence percentages.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>🎯</div>
            <h3>Job Match</h3>
            <p>Paste any job description and see how your skills match up with requirements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>📈</div>
            <h3>Improvement Suggestions</h3>
            <p>Actionable recommendations to improve your GitHub profile and career prospects.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works-inner">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get your career dashboard in four simple steps
          </p>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Enter Username or URL</h3>
              <p>Enter a GitHub username or paste their profile link</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>GitHub Analysis</h3>
              <p>We fetch and analyze all public repositories</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>AI Processing</h3>
              <p>Gemini AI evaluates code quality and practices</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Career Dashboard</h3>
              <p>View insights, scores, and improvement tips</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiter CTA */}
      <section className="recruiter-cta" id="contact">
        <h2>Hiring Developers?</h2>
        <p>Use GitHire AI to evaluate candidates with structured engineering frameworks</p>
        <a href="/recruiter" className="btn-cta">Recruiter Login</a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 GitHire AI by Vision Tech. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;