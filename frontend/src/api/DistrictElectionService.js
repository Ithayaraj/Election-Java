import api from './axios'; // axios is pre-configured in src/api/axios.js

// 🔹 GET all district elections: /district-election
export const getAllDistrictElections = () => api.get('/district-election');

// 🔹 GET district election by ID: /district-election/{id}
export const getDistrictElectionById = (id) => api.get('/district-election/${id}');

// 🔹 GET all district elections for a specific year: /district-election/all-by-year/{year}
export const getAllDistrictElectionsByYear = (year) => api.get('/district-election/all-by-year/${year}');

// 🔹 POST: create new district election: /district-election
export const createDistrictElection = (districtElectionData) =>
  api.post('/district-election', JSON.stringify(districtElectionData));

// 🔹 PUT: update district election by ID: /district-election/{id}
export const updateDistrictElection = (id, updatedDistrictElectionData) =>
  api.put('/district-election/${id}', JSON.stringify(updatedDistrictElectionData));

// 🔹 DELETE: delete district election by ID: /district-election/{id}
export const deleteDistrictElection = (id) => api.delete('/district-election/${id}');