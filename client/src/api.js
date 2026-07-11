import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('githire_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyzeGithub = async (username, options = {}) => {
  const { data } = await api.post('/analyze', { username, ...options });
  return data;
};

export const analyzeGithubProgressive = async (username, options = {}, onUpdate) => {
  try {
    const basicResponse = await api.post('/analyze/basic', { username });
    if (onUpdate) {
      onUpdate({ stage: 'basic', data: basicResponse.data });
    }

    const detailsResponse = await api.post('/analyze/details', { username, ...options });
    if (onUpdate) {
      onUpdate({ stage: 'details', data: detailsResponse.data });
    }

    return detailsResponse.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const { data } = await api.post('/analyze', { username });
      if (onUpdate) {
        onUpdate({ stage: 'fallback', data });
      }
      return data;
    }
    throw error;
  }
};

export const matchJobDescription = async (username, jobDescription, options = {}) => {
  const { data } = await api.post('/match-job', { username, jobDescription, ...options });
  return data;
};

export const loginRecruiter = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const signupRecruiter = async (email, password, name) => {
  const { data } = await api.post('/auth/signup', { email, password, name });
  return data;
};

export const evaluateCandidate = async (username, options = {}) => {
  const body = { username, ...options };
  const { data } = await api.post('/recruiter/evaluate', body);
  return data;
};

export const getSavedReports = async () => {
  const { data } = await api.get('/recruiter/reports');
  return data;
};

export const saveReport = async (reportData) => {
  const { data } = await api.post('/recruiter/reports', reportData);
  return data;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('githire_token', token);
    return;
  }
  localStorage.removeItem('githire_token');
};

export default api;