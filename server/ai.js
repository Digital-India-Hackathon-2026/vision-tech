import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-1.5-pro';

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
      "engineeringRating": <0-10>
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
      "technologies": ["<tech1>", "<tech2>"]
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
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();

  // Clean up markdown code blocks if present
  let cleaned = text;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(json)?\n?/g, '').trim();
  }

  return JSON.parse(cleaned);
}

export async function analyzeStudentProfile(username, profile, repos) {
  const prompt = getStudentPrompt(username, profile, repos);
  return await callGemini(prompt);
}

export async function matchJobDescription(username, profile, technologies, jobDescription) {
  const prompt = getJobMatchPrompt(username, profile, technologies, jobDescription);
  return await callGemini(prompt);
}

export async function evaluateCandidateForRecruiter(username, profile, repos) {
  const prompt = getRecruiterPrompt(username, profile, repos);
  return await callGemini(prompt);
}