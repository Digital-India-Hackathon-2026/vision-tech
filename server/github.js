import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

export async function fetchUserProfile(username) {
  const { data } = await githubClient.get(`/users/${username}`);
  return {
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    bio: data.bio,
    public_repos: data.public_repos,
    followers: data.followers,
    following: data.following,
    created_at: data.created_at,
    html_url: data.html_url,
  };
}

export async function fetchUserRepos(username) {
  const { data } = await githubClient.get(`/users/${username}/repos?per_page=100&sort=updated&direction=desc`);
  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    languages_url: repo.languages_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    size: repo.size,
    topics: repo.topics || [],
    html_url: repo.html_url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    has_readme: false, // Will be checked
    has_license: !!repo.license,
    has_wiki: repo.has_wiki,
    has_pages: repo.has_pages,
  }));
}

export async function fetchRepoLanguages(username, repoName) {
  try {
    const { data } = await githubClient.get(`/repos/${username}/${repoName}/languages`);
    return data;
  } catch {
    return {};
  }
}

export async function fetchRepoReadme(username, repoName) {
  try {
    const { data } = await githubClient.get(`/repos/${username}/${repoName}/readme`);
    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch {
    return null;
  }
}

export async function fetchRepoContents(username, repoName, path = '') {
  try {
    const { data } = await githubClient.get(`/repos/${username}/${repoName}/contents/${path}`);
    return data;
  } catch {
    return [];
  }
}

export async function analyzeRepository(username, repo) {
  const languages = await fetchRepoLanguages(username, repo.name);
  const readme = await fetchRepoReadme(username, repo.name);
  const rootContents = await fetchRepoContents(username, repo.name);

  const hasReadme = !!readme;
  const hasTests = rootContents.some(
    (item) =>
      item.type === 'dir' &&
      ['test', 'tests', '__tests__', 'spec', 'specs'].includes(item.name.toLowerCase())
  );
  const hasConfigFiles = rootContents.some(
    (item) =>
      item.type === 'file' &&
      [
        '.github',
        'docker-compose.yml',
        'Dockerfile',
        '.env.example',
        'Makefile',
        'tsconfig.json',
        '.eslintrc',
        '.prettierrc',
      ].includes(item.name)
  );
  const hasCiCd = rootContents.some(
    (item) =>
      item.name === '.github' || item.name === '.gitlab-ci.yml' || item.name === '.circleci'
  );

  return {
    ...repo,
    languages,
    readmeLength: readme ? readme.length : 0,
    hasReadme,
    hasTests,
    hasConfigFiles,
    hasCiCd,
    technologies: Object.keys(languages),
  };
}