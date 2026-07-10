import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CANDIDATES = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

function extractJsonText(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```$/g, '').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIndex = -1;
  if (firstBrace === -1) {
    startIndex = firstBracket;
  } else if (firstBracket === -1) {
    startIndex = firstBrace;
  } else {
    startIndex = Math.min(firstBrace, firstBracket);
  }

  if (startIndex > 0) {
    cleaned = cleaned.slice(startIndex).trim();
  }

  return cleaned;
}

function getTopTechnologies(repos, limit = 6) {
  const techMap = new Map();

  repos.forEach((repo) => {
    (repo.technologies || []).forEach((tech) => {
      techMap.set(tech, (techMap.get(tech) || 0) + 1);
    });
  });

  const maxCount = Math.max(...techMap.values(), 1);

  return Array.from(techMap.entries())
    .map(([name, count]) => ({
      name,
      confidence: Math.round((count / maxCount) * 100),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

function scoreRepository(repo) {
  let score = 35;

  score += Math.min((repo.stargazers_count || 0) * 4, 20);
  score += Math.min((repo.forks_count || 0) * 3, 10);
  score += repo.hasReadme ? 12 : 0;
  score += repo.hasTests ? 12 : 0;
  score += repo.hasCiCd ? 8 : 0;
  score += repo.hasLicense ? 3 : 0;
  score += Object.keys(repo.languages || {}).length > 1 ? 5 : 0;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildRepoInsights(repos) {
  return repos.slice(0, 10).map((repo) => {
    const technologies = repo.technologies || [];
    const repoScore = scoreRepository(repo);
    const complexity = Math.max(
      1,
      Math.min(10, Math.round((technologies.length || 1) + (repo.hasTests ? 2 : 0) + (repo.hasCiCd ? 1 : 0)))
    );

    return {
      name: repo.name,
      score: repoScore,
      technologies: technologies.slice(0, 5),
      complexity,
      engineeringRating: Math.max(1, Math.min(10, Math.round(repoScore / 10))),
      reason: repo.reason || 'Derived from stars, forks, documentation, tests, CI/CD, and language breadth',
    };
  });
}

function buildStudentFallback(username, profile, repos) {
  const technologies = getTopTechnologies(repos);
  const repositories = buildRepoInsights(repos).sort((a, b) => b.score - a.score);
  const repoCount = repos.length;
  const averageScore = repositories.length
    ? Math.round(repositories.reduce((sum, repo) => sum + repo.score, 0) / repositories.length)
    : 0;
  const score = Math.max(25, Math.min(95, Math.round((averageScore + Math.min(repoCount * 4, 20) + Math.min(technologies.length * 3, 15)) / 2)));
  const hasTesting = repos.some((repo) => repo.hasTests);
  const hasDocs = repos.some((repo) => repo.hasReadme);
  const hasCi = repos.some((repo) => repo.hasCiCd);

  return {
    score,
    scoreReason: `Combined repository quality (${averageScore}/100 average), profile activity (${repoCount} repos), and stack breadth (${technologies.length} technologies)`,
    careerLevel: score >= 85 ? 'Senior Developer' : score >= 65 ? 'Mid-Level Developer' : 'Junior Developer',
    bestRole: technologies[0]?.name ? `${technologies[0].name} Developer` : 'Software Developer',
    repoCount,
    feedback: {
      strengths: [
        `Public repos: ${repoCount}`,
        hasDocs ? 'Projects include documentation' : 'Projects are available for review',
        technologies.length > 0 ? `Primary stack: ${technologies.slice(0, 3).map((tech) => tech.name).join(', ')}` : 'Clear public GitHub presence',
      ],
      weaknesses: [
        hasTesting ? 'Some repositories already include tests' : 'Testing coverage is limited',
        hasCi ? 'CI/CD is partially present' : 'CI/CD automation is limited',
        repos.length > 0 ? 'Repository depth varies across projects' : 'No repositories available for analysis',
      ],
      suggestions: [
        'Add automated tests to the most important repositories',
        'Document setup and usage in each README',
        'Showcase deployment or CI/CD on at least one project',
      ],
    },
    technologies,
    repositories,
    practices: {
      Authentication: hasCi ? 'Good' : 'Needs Improvement',
      'REST APIs': technologies.some((tech) => /express|fastify|nestjs|flask|django|spring/i.test(tech.name)) ? 'Good' : 'Needs Improvement',
      'MVC Architecture': repos.some((repo) => repo.hasReadme) ? 'Good' : 'Needs Improvement',
      'Database Integration': technologies.some((tech) => /mongo|sql|prisma|sequelize|mongoose|postgres|mysql/i.test(tech.name)) ? 'Good' : 'Needs Improvement',
      'Error Handling': hasTesting ? 'Good' : 'Needs Improvement',
      'Input Validation': hasTesting ? 'Good' : 'Needs Improvement',
      'Environment Variables': repos.some((repo) => repo.hasConfigFiles) ? 'Good' : 'Needs Improvement',
      Deployment: hasCi ? 'Good' : 'Needs Improvement',
      Testing: hasTesting ? 'Good' : 'Needs Improvement',
      Documentation: hasDocs ? 'Good' : 'Needs Improvement',
    },
    practiceReasons: {
      Authentication: hasCi ? 'Public workflows or automation were detected.' : 'No clear authentication-focused implementation was detected in public metadata.',
      'REST APIs': technologies.some((tech) => /express|fastify|nestjs|flask|django|spring/i.test(tech.name)) ? 'Backend web framework patterns were detected.' : 'No obvious API framework evidence was found in the repository metadata.',
      'MVC Architecture': repos.some((repo) => repo.hasReadme) ? 'Readable project structure and documentation suggest organized separation.' : 'Insufficient structure signals were available from public metadata.',
      'Database Integration': technologies.some((tech) => /mongo|sql|prisma|sequelize|mongoose|postgres|mysql/i.test(tech.name)) ? 'Database-related technologies were detected in the stack.' : 'No database technology signals were detected.',
      'Error Handling': hasTesting ? 'Testing presence indicates better handling discipline.' : 'Testing signals were weak, so reliability is uncertain.',
      'Input Validation': hasTesting ? 'Validation is more likely when automated testing exists.' : 'Validation evidence was not strong enough to confirm.',
      'Environment Variables': repos.some((repo) => repo.hasConfigFiles) ? 'Configuration files suggest environment setup awareness.' : 'No .env example or config file signals were detected.',
      Deployment: hasCi ? 'CI/CD indicators suggest deployment maturity.' : 'No deployment automation was visible in public metadata.',
      Testing: hasTesting ? 'Test folders or specs were detected.' : 'No test directory pattern was detected.',
      Documentation: hasDocs ? 'README content was present.' : 'README evidence was missing or limited.',
    },
    traits: [
      score >= 80 ? 'High-ownership builder' : 'Pragmatic builder',
      technologies[0]?.name ? `${technologies[0].name} focused` : 'Generalist profile',
      hasDocs ? 'Documentation-aware' : 'Fast-moving',
      hasTesting ? 'Quality-oriented' : 'Prototype-oriented',
      repos.length >= 5 ? 'Consistent contributor' : 'Early-stage portfolio',
    ],
  };
}

function buildJobMatchFallback(profile, technologies, jobDescription) {
  const normalizedJob = jobDescription.toLowerCase();
  const techNames = technologies.map((tech) => tech.name.toLowerCase());
  const strongSkills = technologies
    .filter((tech) => normalizedJob.includes(tech.name.toLowerCase()) || tech.confidence >= 60)
    .map((tech) => tech.name)
    .slice(0, 5);
  const missingSkills = Array.from(new Set(
    ['testing', 'deployment', 'system design', 'apis', 'databases', 'authentication']
      .filter((skill) => normalizedJob.includes(skill) && !techNames.some((name) => name.includes(skill)))
  )).slice(0, 5);

  const overlap = strongSkills.length;
  const matchPercentage = Math.max(20, Math.min(95, Math.round((overlap / Math.max(technologies.length || 1, 3)) * 100)));

  return {
    matchPercentage,
    matchReason: overlap > 0 ? `Matched ${strongSkills.length} clearly relevant technologies against the job description.` : 'The match was estimated from general stack overlap and job keywords.',
    strongSkills: strongSkills.length > 0 ? strongSkills : technologies.slice(0, 3).map((tech) => tech.name),
    missingSkills: missingSkills.length > 0 ? missingSkills : ['job-specific requirements not fully covered'],
  };
}

function buildRecruiterFallback(username, profile, repos) {
  const technologies = getTopTechnologies(repos);
  const repositories = buildRepoInsights(repos).sort((a, b) => b.score - a.score);
  const avgRepoScore = repositories.length
    ? Math.round(repositories.reduce((sum, repo) => sum + repo.score, 0) / repositories.length)
    : 0;
  const hireScore = Math.max(20, Math.min(95, Math.round((avgRepoScore + Math.min(repos.length * 4, 20) + Math.min(technologies.length * 3, 15)) / 2)));
  const engineeringScore = Math.max(20, Math.min(95, Math.round((hireScore + avgRepoScore) / 2)));
  const experienceLevel = repos.length >= 8 || hireScore >= 70 ? 'Experienced' : 'Fresher';

  return {
    hireScore,
    engineeringScore,
    hireReason: `Hiring score is based on average repository quality (${avgRepoScore}/100), repository activity (${repos.length} repos), and stack breadth (${technologies.length} technologies).`,
    careerLevel: hireScore >= 85 ? 'Senior' : hireScore >= 65 ? 'Mid-Level' : 'Junior',
    bestRole: technologies[0]?.name ? `${technologies[0].name} Engineer` : 'Software Engineer',
    experienceLevel,
    frameworkScores: {
      'Project Quality': Math.min(100, avgRepoScore),
      'Engineering Practices': Math.min(100, Math.max(30, avgRepoScore - 5)),
      'Learning Curve': Math.min(100, 40 + technologies.length * 8),
      'Documentation': Math.min(100, repos.some((repo) => repo.hasReadme) ? 75 : 35),
      'Activity': Math.min(100, 40 + Math.min(repos.length * 6, 40)),
    },
    repositories: repositories.map((repo) => ({
      name: repo.name,
      score: repo.score,
      technologies: repo.technologies,
      reason: repo.reason,
    })),
    interviewQuestions: repositories.slice(0, 5).map((repo) => ({
      repository: repo.name,
      question: `What trade-offs did you consider while building ${repo.name}?`,
    })),
  };
}

function getStudentPrompt(username, profile, repos) {
  const repoSummary = repos
    .slice(0, 10)
    .map(
      (r) =>
        `- ${r.name}: ${r.description || 'No description'}, Language: ${r.language || 'N/A'}, Stars: ${r.stargazers_count}, Forks: ${r.forks_count}, Has README: ${r.hasReadme}, Has Tests: ${r.hasTests}, Technologies: ${(r.technologies || []).join(', ')}`
    )
    .join('\n');

  return `
You are an expert engineering evaluator. Analyze this GitHub profile and provide structured JSON output.

Username: ${username}
Name: ${profile.name || 'N/A'}
Bio: ${profile.bio || 'N/A'}
Public Repos: ${profile.public_repos}
Followers: ${profile.followers}
Following: ${profile.following}

Top Repositories:
${repoSummary}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "score": <number 0-100>,
  "scoreReason": "<one-sentence reason for the score>",
  "careerLevel": "<Junior Developer | Mid-Level Developer | Senior Developer | Lead Developer | Principal Engineer>",
  "bestRole": "<best fitting role based on tech stack>",
  "repoCount": <number>,
  "feedback": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
  },
  "technologies": [
    {"name": "<tech name>", "confidence": <0-100>}
  ],
  "repositories": [
    {
      "name": "<repo name>",
      "score": <0-100>,
      "technologies": ["<tech1>", "<tech2>"],
      "complexity": <0-10>,
      "engineeringRating": <0-10>,
      "reason": "<one-sentence reason for the repository score>"
    }
  ],
  "practices": {
    "Authentication": "<Excellent | Good | Needs Improvement>",
    "REST APIs": "<Excellent | Good | Needs Improvement>",
    "MVC Architecture": "<Excellent | Good | Needs Improvement>",
    "Database Integration": "<Excellent | Good | Needs Improvement>",
    "Error Handling": "<Excellent | Good | Needs Improvement>",
    "Input Validation": "<Excellent | Good | Needs Improvement>",
    "Environment Variables": "<Excellent | Good | Needs Improvement>",
    "Deployment": "<Excellent | Good | Needs Improvement>",
    "Testing": "<Excellent | Good | Needs Improvement>",
    "Documentation": "<Excellent | Good | Needs Improvement>"
  },
  "traits": ["<trait 1>", "<trait 2>", "<trait 3>", "<trait 4>", "<trait 5>"]
}

Be thorough and honest in your evaluation. Base scores on actual repository analysis.
`;
}

function getJobMatchPrompt(username, profile, technologies, jobDescription) {
  const techList = technologies.map((t) => `${t.name} (${t.confidence}%)`).join(', ');

  return `
You are an expert job matching AI. Compare this developer's profile with the job description.

Developer: ${profile.name || username}
Technologies: ${techList}

Job Description:
${jobDescription}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "matchPercentage": <0-100>,
  "matchReason": "<one-sentence reason for the match>",
  "strongSkills": ["<skill 1>", "<skill 2>"],
  "missingSkills": ["<skill 1>", "<skill 2>"]
}
`;
}

function getRecruiterPrompt(username, profile, repos) {
  const repoSummary = repos
    .slice(0, 10)
    .map(
      (r) =>
        `- ${r.name}: Stars: ${r.stargazers_count}, Forks: ${r.forks_count}, Has README: ${r.hasReadme}, Has Tests: ${r.hasTests}, Has CI/CD: ${r.hasCiCd}, Technologies: ${(r.technologies || []).join(', ')}`
    )
    .join('\n');

  return `
You are an expert technical recruiter. Evaluate this candidate for hiring.

Username: ${username}
Name: ${profile.name || 'N/A'}
Bio: ${profile.bio || 'N/A'}
Followers: ${profile.followers}
Public Repos: ${profile.public_repos}

Repositories:
${repoSummary}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "hireScore": <0-100>,
  "engineeringScore": <0-100>,
  "hireReason": "<one-sentence reason for the hire score>",
  "careerLevel": "<Junior | Mid-Level | Senior | Lead>",
  "bestRole": "<best fitting role>",
  "experienceLevel": "<Fresher | Experienced>",
  "frameworkScores": {
    "Project Quality": <0-100>,
    "Engineering Practices": <0-100>,
    "Learning Curve": <0-100>,
    "Documentation": <0-100>,
    "Activity": <0-100>
  },
  "repositories": [
    {
      "name": "<repo name>",
      "score": <0-100>,
      "technologies": ["<tech1>", "<tech2>"],
      "reason": "<one-sentence reason for the repository score>"
    }
  ],
  "interviewQuestions": [
    {
      "repository": "<repo name>",
      "question": "<project-specific interview question>"
    }
  ]
}

For Freshers use: Project Quality (30%), Engineering Practices (25%), Learning Curve (20%), Documentation (10%), Activity (15%)
For Experienced use: Architecture (20%), Engineering (25%), Open Source (20%), Deployment (10%), Testing (10%), Leadership (15%)
`;
}

async function callGemini(prompt) {
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const cleaned = extractJsonText(text);

      return JSON.parse(cleaned);
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      if (status === 429 || /quota|rate limit/i.test(error?.message || '')) {
        break;
      }
      if (status && ![404, 503].includes(status)) {
        break;
      }
    }
  }

  if (lastError instanceof SyntaxError) {
    throw new Error(`Gemini returned invalid JSON: ${lastError.message}`);
  }

  throw lastError || new Error('Gemini request failed');
}

export async function analyzeStudentProfile(username, profile, repos) {
  const prompt = getStudentPrompt(username, profile, repos);

  try {
    return await callGemini(prompt);
  } catch (error) {
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return buildStudentFallback(username, profile, repos);
    }
    throw error;
  }
}

export async function matchJobDescription(username, profile, technologies, jobDescription) {
  const prompt = getJobMatchPrompt(username, profile, technologies, jobDescription);

  try {
    return await callGemini(prompt);
  } catch (error) {
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return buildJobMatchFallback(profile, technologies, jobDescription);
    }
    throw error;
  }
}

export async function evaluateCandidateForRecruiter(username, profile, repos) {
  const prompt = getRecruiterPrompt(username, profile, repos);

  try {
    return await callGemini(prompt);
  } catch (error) {
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return buildRecruiterFallback(username, profile, repos);
    }
    throw error;
  }
}