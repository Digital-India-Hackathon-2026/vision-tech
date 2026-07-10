import axios from 'axios';

const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const CACHE_TTL_MS = 10 * 60 * 1000;
const requestCache = new Map();

const githubClient = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

const githubGraphqlClient = axios.create({
  baseURL: GITHUB_GRAPHQL,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

function getCache(key) {
  const cached = requestCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    requestCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCache(key, value) {
  requestCache.set(key, { timestamp: Date.now(), value });
}

export async function fetchUserProfile(username) {
  const cacheKey = `profile:${username}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data } = await githubClient.get(`/users/${username}`);

  const profile = {
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

  // Store in cache
  setCache(cacheKey, profile);

  return profile;
}

export async function fetchUserRepos(username) {
  const cacheKey = `repos:${username}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data } = await githubClient.get(`/users/${username}/repos?per_page=100&sort=updated&direction=desc`);
  const repos = data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    languages_url: repo.languages_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    default_branch: repo.default_branch,
    size: repo.size,
    topics: repo.topics || [],
    html_url: repo.html_url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    has_readme: false, // Will be checked
    has_license: !!repo.license,
    has_wiki: repo.has_wiki,
    has_pages: repo.has_pages,
    license: repo.license || null,
  }));

  setCache(cacheKey, repos);
  return repos;
}

export async function fetchRepoLanguages(username, repoName) {
  try {
    const cacheKey = `languages:${username}/${repoName}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { data } = await githubClient.get(`/repos/${username}/${repoName}/languages`);
    setCache(cacheKey, data);
    return data;
  } catch {
    return {};
  }
}

export async function fetchRepoReadme(username, repoName) {
  try {
    const cacheKey = `readme:${username}/${repoName}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { data } = await githubClient.get(`/repos/${username}/${repoName}/readme`);
    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    setCache(cacheKey, content);
    return content;
  } catch {
    return null;
  }
}

export async function fetchRepoContents(username, repoName, path = '') {
  try {
    const cacheKey = `contents:${username}/${repoName}/${path}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { data } = await githubClient.get(`/repos/${username}/${repoName}/contents/${path}`);
    setCache(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}

export async function fetchRepoCommitCount(username, repoName) {
  if (!process.env.GITHUB_TOKEN) return null;

  const cacheKey = `commitCount:${username}/${repoName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const query = `query($owner: String!, $repo: String!) { repository(owner: $owner, name: $repo) { defaultBranchRef { target { ... on Commit { history(first: 0) { totalCount } } } } } }`;
    const response = await githubGraphqlClient.post('', {
      query,
      variables: {
        owner: username,
        repo: repoName,
      },
    });

    const totalCount = response.data?.data?.repository?.defaultBranchRef?.target?.history?.totalCount || null;
    setCache(cacheKey, totalCount);
    return totalCount;
  } catch {
    return null;
  }
}

export async function fetchRepoCommitMetadata(username, repoName) {
  if (!process.env.GITHUB_TOKEN) return null;

  const cacheKey = `repoCommitMetadata:${username}/${repoName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const query = `query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          name
          target {
            ... on Commit {
              committedDate
              history(first: 1) {
                totalCount
              }
            }
          }
        }
        pullRequests(states: OPEN) {
          totalCount
        }
        issues(states: OPEN) {
          totalCount
        }
        repositoryTopics(first: 20) {
          nodes {
            topic {
              name
            }
          }
        }
        licenseInfo {
          name
          spdxId
          url
        }
      }
    }`;

    const response = await githubGraphqlClient.post('', {
      query,
      variables: {
        owner: username,
        repo: repoName,
      },
    });

    const repoData = response.data?.data?.repository;
    const metadata = {
      commitCount: repoData?.defaultBranchRef?.target?.history?.totalCount ?? null,
      lastCommitDate: repoData?.defaultBranchRef?.target?.committedDate ?? null,
      defaultBranch: repoData?.defaultBranchRef?.name ?? null,
      openPullRequestCount: repoData?.pullRequests?.totalCount ?? null,
      openIssueCount: repoData?.issues?.totalCount ?? null,
      topics: repoData?.repositoryTopics?.nodes?.map((node) => node.topic?.name).filter(Boolean) ?? [],
      licenseInfo: repoData?.licenseInfo
        ? {
            name: repoData.licenseInfo.name,
            spdxId: repoData.licenseInfo.spdxId,
            url: repoData.licenseInfo.url,
          }
        : null,
    };

    setCache(cacheKey, metadata);
    return metadata;
  } catch {
    return null;
  }
}

export async function fetchRepoBranchInfo(username, repoName, branchName) {
  if (!branchName) return null;

  try {
    const cacheKey = `branchInfo:${username}/${repoName}/${branchName}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { data } = await githubClient.get(`/repos/${username}/${repoName}/branches/${encodeURIComponent(branchName)}`);
    const info = {
      defaultBranch: data.name,
      defaultBranchProtected: data.protected ?? false,
      branchProtection: Boolean(data.protection),
    };
    setCache(cacheKey, info);
    return info;
  } catch {
    return null;
  }
}

export async function fetchRepoContributorCount(username, repoName) {
  try {
    const cacheKey = `contributors:${username}/${repoName}`;
    const cached = getCache(cacheKey);
    if (cached != null) return cached;

    const { data } = await githubClient.get(`/repos/${username}/${repoName}/contributors?per_page=100&anon=true`);
    const count = Array.isArray(data) ? data.length : null;
    setCache(cacheKey, count);
    return count;
  } catch {
    return null;
  }
}

export async function analyzeRepository(username, repo) {
  const [languages, readme, rootContents, commitMetadata, branchInfo, contributorCount] = await Promise.all([
    fetchRepoLanguages(username, repo.name),
    fetchRepoReadme(username, repo.name),
    fetchRepoContents(username, repo.name),
    fetchRepoCommitMetadata(username, repo.name),
    fetchRepoBranchInfo(username, repo.name, repo.default_branch),
    fetchRepoContributorCount(username, repo.name),
  ]);

  const commitCount = commitMetadata?.commitCount ?? null;
  const lastCommitDate = commitMetadata?.lastCommitDate ?? null;
  const lastCommitAgeDays = lastCommitDate ? Math.round((Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)) : null;
  const defaultBranch = commitMetadata?.defaultBranch ?? repo.default_branch ?? null;
  const openPullRequestCount = commitMetadata?.openPullRequestCount ?? null;
  const openIssueCount = commitMetadata?.openIssueCount ?? null;
  const topics = commitMetadata?.topics?.length ? commitMetadata.topics : repo.topics;
  const licenseInfo = commitMetadata?.licenseInfo ?? (repo.license ? {
    name: repo.license.name,
    spdxId: repo.license.spdx_id,
    url: repo.license.url,
  } : null);

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
  const reasonParts = [];
  if (hasReadme) reasonParts.push('README present');
  if (hasTests) reasonParts.push('tests detected');
  if (hasCiCd) reasonParts.push('CI/CD files detected');
  if (Object.keys(languages).length > 0) reasonParts.push(`languages: ${Object.keys(languages).slice(0, 3).join(', ')}`);

  return {
    ...repo,
    languages,
    readmeLength: readme ? readme.length : 0,
    hasReadme,
    hasTests,
    hasConfigFiles,
    hasCiCd,
    commitCount,
    lastCommitDate,
    lastCommitAgeDays,
    defaultBranch,
    defaultBranchProtected: branchInfo?.defaultBranchProtected ?? false,
    branchProtection: branchInfo?.branchProtection ?? false,
    openPullRequestCount,
    openIssueCount,
    contributorCount,
    topics,
    license: licenseInfo,
    technologies: Object.keys(languages),
    reason: reasonParts.length > 0 ? reasonParts.join(' · ') : 'Repository analyzed from public GitHub metadata',
  };
}

export async function fetchUserActivity(username) {
  try {
    const { data } = await githubClient.get(`/users/${username}/events/public`);

    return {
      contributionSource: "GitHub Public Events",
      totalEvents: data.length,
      recentEvents: data.slice(0, 10).map(event => ({
        type: event.type,
        repo: event.repo?.name,
        createdAt: event.created_at,
      })),
    };
  } catch (error) {
    return {
      contributionSource: "Unavailable",
      totalEvents: 0,
      recentEvents: [],
    };
  }
}