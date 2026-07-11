import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MODEL_PROVIDERS = ['gemini', 'openai', 'grok'];
const MODEL_OPTIONS = {
  gemini: ['default'],
  openai: ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  grok: ['grok-1'],
};

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
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(MODEL_OPTIONS.gemini[0]);
  const navigate = useNavigate();

  const handleAnalyze = (e) => {
    e.preventDefault();
    setError('');
    const username = extractUsername(input);
    if (!username) {
      setError('Enter a valid GitHub username or URL (e.g., HAREESSHP or https://github.com/HAREESSHP)');
      return;
    }
    navigate(`/dashboard/${username}?provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(model)}`);
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <h1>Transform Your GitHub Into Career Intelligence</h1>
            <p>
              AI analyzes your repositories and provides engineering insights,
              career guidance, and job matching to help you land your dream role.
            </p>
            <form className="hero-search" onSubmit={handleAnalyze}>
              <input
                id="landing-username"
                name="username"
                type="text"
                placeholder="GitHub username or profile URL..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="model-selection-row">
                <label className="select-field">
                  <span>Provider</span>
                  <select id="landing-provider" name="provider" value={provider} onChange={(e) => {
                    setProvider(e.target.value);
                    setModel(MODEL_OPTIONS[e.target.value][0]);
                  }}>
                    {MODEL_PROVIDERS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                {MODEL_OPTIONS[provider].length > 1 ? (
                  <label className="select-field">
                    <span>Model</span>
                    <select id="landing-model" name="model" value={model} onChange={(e) => setModel(e.target.value)}>
                      {MODEL_OPTIONS[provider].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="select-field fixed-model">
                    <span>Model</span>
                    <div id="landing-model" className="fixed-model-value">{MODEL_OPTIONS[provider][0]}</div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={!input.trim()}>
                Analyze Profile
              </button>
            </form>
            <div className="hero-actions">
              <a href="#features" className="btn-ghost">View Features</a>
              <a href="#how-it-works" className="btn-ghost subtle">How It Works</a>
            </div>
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                {error}
              </p>
            )}
            <div className="hero-stats">
              <div className="hero-stat">
                <h3>GitHub</h3>
                <p>Public profiles only</p>
              </div>
              <div className="hero-stat">
                <h3>AI</h3>
                <p>Explainable scoring</p>
              </div>
              <div className="hero-stat">
                <h3>Recruiters</h3>
                <p>Structured review flow</p>
              </div>
            </div>
          </div>

          <div className="hero-preview">
            <div className="preview-glow preview-glow-primary"></div>
            <div className="preview-glow preview-glow-secondary"></div>
            <div className="preview-card">
              <div className="preview-card-header">
                <div>
                  <p className="preview-label">GitHub Snapshot</p>
                  <h3>sample-dev</h3>
                </div>
                <span className="preview-pill">92 / 100</span>
              </div>
              <div className="preview-score">
                <div className="score-circle" style={{ '--score': '92%' }}>
                  <span>92</span>
                </div>
                <div>
                  <p className="preview-label">Best Role</p>
                  <strong>Full Stack Developer</strong>
                  <p className="preview-copy">Strong project structure, solid React + Node stack, and good documentation.</p>
                </div>
              </div>
              <div className="preview-tags">
                <span className="tag tag-primary">React</span>
                <span className="tag tag-success">Node.js</span>
                <span className="tag tag-warning">MongoDB</span>
              </div>
              <div className="preview-bars">
                <div className="preview-bar">
                  <span>Engineering Practices</span>
                  <div><i style={{ width: '86%' }}></i></div>
                </div>
                <div className="preview-bar">
                  <span>Documentation</span>
                  <div><i style={{ width: '78%' }}></i></div>
                </div>
                <div className="preview-bar">
                  <span>Testing</span>
                  <div><i style={{ width: '64%' }}></i></div>
                </div>
              </div>
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
            <div className="feature-icon">🤖</div>
            <h3>AI Feedback</h3>
            <p>Get personalized AI-powered feedback on your repositories and coding practices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Repository Ranking</h3>
            <p>Every repository scored and ranked based on quality, complexity, and engineering practices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Engineering Analysis</h3>
            <p>Evaluate authentication, APIs, architecture, testing, documentation, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Tech Stack Analysis</h3>
            <p>Identify your strongest technologies with confidence percentages.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Job Match</h3>
            <p>Paste any job description and see how your skills match up with requirements.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
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
        <div className="recruiter-cta-inner">
          <div>
            <p className="section-kicker">Hiring Developers?</p>
            <h2>Use structured engineering frameworks instead of manual repo review.</h2>
            <p>GitHire AI helps recruiters compare candidates, generate interview questions, and save reports.</p>
          </div>
          <a href="/recruiter" className="btn-cta">Recruiter Login</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">G</div>
            <div>
              <h3>GitHire AI</h3>
              <p>Designed and developed by Team Vision Tech</p>
            </div>
          </div>

          <div className="footer-team">
            <a href="https://www.linkedin.com/in/hareesh-ai-dev" target="_blank" rel="noreferrer">Hareesh</a>
            <a href="https://www.linkedin.com/in/pavan-sai-varshith" target="_blank" rel="noreferrer">Pavan Sai</a>
            <a href="https://www.linkedin.com/in/rahul-ai-dev?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer">Rahul</a>
            <a href="https://www.linkedin.com/in/sri-harsha-tolikonda-95ba22290?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer">Sri Harsha</a>
          </div>

          <div className="footer-meta">
            <span>Team - Vision Tech</span>
            <p>Built for the GitHire AI hackathon submission.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;