import api from './axios'; // axios is pre-configured in src/api/axios.js

// 🔹 GET all provinces: /province
export const getAllProvinces = () => api.get('/province');

// 🔹 GET province by ID: /province/{id}
export const getProvinceById = (id) => api.get(`/province/${id}`);

// 🔹 GET districts by province: /province/{id}/districts
export const getDistrictsByProvince = (id) => api.get(`/province/${id}/districts`);

// 🔹 GET seats by province: /province/{id}/seats
export const getSeatsByProvince = (id) => api.get(`/province/${id}/seats`);

// 🔹 POST: create new province
export const createProvince = (provinceData) =>
  api.post('/province', JSON.stringify(provinceData));

// 🔹 PUT: update province by ID
export const updateProvince = (id, updatedProvinceData) =>
  api.put(`/province/${id}`, JSON.stringify(updatedProvinceData));

// 🔹 DELETE: delete province by ID
export const deleteProvince = (id) => api.delete(`/province/${id}`);
