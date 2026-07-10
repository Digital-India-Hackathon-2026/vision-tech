import { Router } from 'express';
import { fetchUserProfile, fetchUserRepos, fetchUserActivity, analyzeRepository } from './github.js';
import { analyzeStudentProfile, matchJobDescription, evaluateCandidateForRecruiter } from './ai.js';
import { signup, login, authMiddleware } from './auth.js';
import { Report } from './model.js';

const router = Router();

// Student: Analyze GitHub profile
router.post('/analyze', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'GitHub username is required' });
    }

    const cleanUsername = username.trim();

    // Fetch GitHub data
    const [profile, repos] = await Promise.all([
      fetchUserProfile(cleanUsername),
      fetchUserRepos(cleanUsername),
    ]);

    // Analyze each repository in detail (limit to 10 for performance)
    const analyzedRepos = await Promise.all(
      repos.slice(0, 10).map((repo) => analyzeRepository(cleanUsername, repo))
    );

    // AI Analysis
    const aiResult = await analyzeStudentProfile(cleanUsername, profile, analyzedRepos);

    res.json({
      profile,
      ...aiResult,
    });
  } catch (error) {
    console.error('Analysis error:', error.message, error.stack);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'GitHub user not found' });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({ message: 'API rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ message: `Analysis failed: ${error.message}` });
  }
});

// Student: Quick snapshot for progressive loading
router.post('/analyze/basic', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'GitHub username is required' });
    }

    const cleanUsername = username.trim();
    const [profile, repos] = await Promise.all([
      fetchUserProfile(cleanUsername),
      fetchUserRepos(cleanUsername),
    ]);

    res.json({
      profile,
      repoCount: repos.length,
      repositories: repos.slice(0, 8).map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        html_url: repo.html_url,
      })),
    });
  } catch (error) {
    console.error('Basic analysis error:', error.message, error.stack);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'GitHub user not found' });
    }
    res.status(500).json({ message: `Basic analysis failed: ${error.message}` });
  }
});

// Student: Detailed analysis payload
router.post('/analyze/details', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'GitHub username is required' });
    }

    const cleanUsername = username.trim();
    const profile = await fetchUserProfile(cleanUsername);
    const repos = await fetchUserRepos(cleanUsername);
    const analyzedRepos = await Promise.all(
      repos.slice(0, 10).map((repo) => analyzeRepository(cleanUsername, repo))
    );

    const aiResult = await analyzeStudentProfile(cleanUsername, profile, analyzedRepos);

    res.json({
      profile,
      ...aiResult,
    });
  } catch (error) {
    console.error('Detailed analysis error:', error.message, error.stack);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'GitHub user not found' });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({ message: 'API rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ message: `Detailed analysis failed: ${error.message}` });
  }
});

// Student: Match job description
router.post('/match-job', async (req, res) => {
  try {
    const { username, jobDescription } = req.body;
    if (!username || !jobDescription) {
      return res.status(400).json({ message: 'Username and job description are required' });
    }

    const profile = await fetchUserProfile(username);
    const repos = await fetchUserRepos(username);
    const analyzedRepos = await Promise.all(
      repos.slice(0, 10).map((repo) => analyzeRepository(username, repo))
    );

    // Extract technologies from analyzed repos
    const techMap = new Map();
    analyzedRepos.forEach((repo) => {
      (repo.technologies || []).forEach((tech) => {
        techMap.set(tech, (techMap.get(tech) || 0) + 1);
      });
    });
    const maxCount = Math.max(...techMap.values(), 1);
    const technologies = Array.from(techMap.entries()).map(([name, count]) => ({
      name,
      confidence: Math.round((count / maxCount) * 100),
    }));

    const result = await matchJobDescription(username, profile, technologies, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Job match error:', error.message);
    res.status(500).json({ message: 'Job matching failed. Please try again.' });
  }
});

// Recruiter: Sign up
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const result = await signup(email, password, name);
    res.json(result);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Recruiter: Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
});

// Recruiter: Evaluate candidate
router.post('/recruiter/evaluate', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'GitHub username is required' });
    }

    const cleanUsername = username.trim();
    const [profile, repos, activity] = await Promise.all([
      fetchUserProfile(cleanUsername),
      fetchUserRepos(cleanUsername),
      fetchUserActivity(cleanUsername),
    ]);
    const analyzedRepos = await Promise.all(
      repos.slice(0, 10).map((repo) => analyzeRepository(cleanUsername, repo))
    );

    const result = await evaluateCandidateForRecruiter(cleanUsername, profile, analyzedRepos, activity);
    const evidence = {
      publicRepositoryCount: profile.public_repos,
      reviewedRepositoryCount: analyzedRepos.length,
      sampledCommits: analyzedRepos.reduce((total, repo) => total + (repo.sampledCommitCount || 0), 0),
      readmeCoverage: analyzedRepos.length ? Math.round(analyzedRepos.filter((repo) => repo.hasReadme).length / analyzedRepos.length * 100) : 0,
      testCoverageSignal: analyzedRepos.length ? Math.round(analyzedRepos.filter((repo) => repo.hasTests).length / analyzedRepos.length * 100) : 0,
      deploymentCoverage: analyzedRepos.length ? Math.round(analyzedRepos.filter((repo) => repo.deploymentUrl).length / analyzedRepos.length * 100) : 0,
      contributionSource: activity.contributionSource,
    };

    res.json({
      profile,
      activity,
      ...result,
      evidence: { ...evidence, ...(result.evidence || {}) },
    });
  } catch (error) {
    console.error('Evaluation error:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'GitHub user not found' });
    }
    res.status(500).json({ message: 'Evaluation failed. Please try again.' });
  }
});

// Recruiter: Get saved reports
router.get('/recruiter/reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ recruiterId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Recruiter: Save report
router.post('/recruiter/reports', authMiddleware, async (req, res) => {
  try {
    const report = await Report.create({
      recruiterId: req.user.id,
      ...req.body,
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save report' });
  }
});

export default router;
