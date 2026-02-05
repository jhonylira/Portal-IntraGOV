import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard
export const getDashboardStats = () => axios.get(`${API}/dashboard/stats`);
export const getMunicipalityDashboard = (id) => axios.get(`${API}/dashboard/municipality/${id}`);

// Projects
export const getProjects = (params) => axios.get(`${API}/projects`, { params });
export const getProject = (id) => axios.get(`${API}/projects/${id}`);
export const createProject = (data) => axios.post(`${API}/projects`, data);
export const updateProject = (id, data) => axios.put(`${API}/projects/${id}`, data);
export const updateProjectStage = (id, stageData) => axios.put(`${API}/projects/${id}/stage`, stageData);

// Municipalities
export const getMunicipalities = () => axios.get(`${API}/municipalities`);
export const getMunicipality = (id) => axios.get(`${API}/municipalities/${id}`);
export const createMunicipality = (data) => axios.post(`${API}/municipalities`, data);
export const updateMunicipalityEngagement = (id, data) => axios.put(`${API}/municipalities/${id}/engagement`, data);

// Queue
export const getQueue = () => axios.get(`${API}/queue`);
export const reorderQueue = (data) => axios.post(`${API}/queue/reorder`, data);

// Team
export const getTeam = () => axios.get(`${API}/team`);
export const allocateTeam = (data) => axios.post(`${API}/team/allocate`, data);

// AI
export const diagnoseComplexity = (data) => axios.post(`${API}/ai/diagnose-complexity`, data);
export const suggestAllocation = (data) => axios.post(`${API}/ai/suggest-allocation`, data);
export const municipalAIAnalysis = (data) => axios.post(`${API}/ai/municipal-analysis`, data);

// Attachments
export const uploadAttachment = (projectId, data) => axios.post(`${API}/projects/${projectId}/attachments`, data);
export const getAttachments = (projectId) => axios.get(`${API}/projects/${projectId}/attachments`);
export const deleteAttachment = (projectId, attachmentId) => axios.delete(`${API}/projects/${projectId}/attachments/${attachmentId}`);

// Notifications
export const getNotifications = () => axios.get(`${API}/notifications`);
export const markNotificationRead = (id) => axios.put(`${API}/notifications/${id}/read`);

// Seed
export const seedData = () => axios.post(`${API}/seed`);
