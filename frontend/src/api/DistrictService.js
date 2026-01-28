import api from './axios'; // axios is pre-configured in src/api/axios.js

// 🔹 GET all districts: /districts
export const getAllDistricts = () => api.get('/districts');

// 🔹 GET all districts with non-zero seat_count: /districts/nonzero
export const getAllDistrictsNonZeroSeats = () => api.get('/districts/nonzero');

// 🔹 GET district by ID: /districts/{id}
export const getDistrictById = (id) => api.get('/districts/${id}');

// 🔹 POST: create new district: /districts
export const createDistrict = (districtData) =>
  api.post('/districts', JSON.stringify(districtData));

// 🔹 POST: create multiple districts: /districts/multiple
export const createMultipleDistricts = (districtsData) =>
  api.post('/districts/multiple', JSON.stringify(districtsData));

// 🔹 PUT: update district by ID: /districts/{id}
export const updateDistrict = (id, updatedDistrictData) =>
  api.put('/districts/${id}', JSON.stringify(updatedDistrictData));

// 🔹 DELETE: delete district by ID: /districts/{id}
export const deleteDistrict = (id) => api.delete('/districts/${id}');