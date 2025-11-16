import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export async function uploadWasteImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await axios.post(`${API_BASE_URL}/analyze-waste`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

export async function getWasteHistory(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);

  const response = await axios.get(`${API_BASE_URL}/waste-history?${params}`);
  return response.data;
}

export async function getWasteStats() {
  const response = await axios.get(`${API_BASE_URL}/waste-stats`);
  return response.data;
}

export async function getSuggestions() {
  const response = await axios.get(`${API_BASE_URL}/suggestions`);
  return response.data;
}

export async function clearWasteHistory() {
  const response = await axios.delete(`${API_BASE_URL}/waste-history`);
  return response.data;
}






