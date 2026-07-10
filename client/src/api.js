import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const analyzeGithub = async (username) => {
  const { data } = await api.post('/analyze', { username });
  return data;
};

export const matchJobDescription = async (username, jobDescription) => {
  const { data } = await api.post('/match-job', { username, jobDescription });
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

export const evaluateCandidate = async (username) => {
  const { data } = await api.post('/recruiter/evaluate', { username });
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

export default api;