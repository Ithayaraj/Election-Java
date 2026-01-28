import api from './axios'; // axios is pre-configured in src/api/axios.js




// 🔹 GET party by ID: /party/{id}
export const getPartyById = (id) => api.get('/party/${id}');

// 🔹 GET parties below 5% threshold for a given year: /threshold_5_percent_below/parties/{year}
export const getPartiesBelowThresholdByYear = (year) => api.get('/threshold_5_percent_below/parties/${year}');
// 🔹 GET all parties: /party
export const getAllParties = () => api.get('/party');

export const yearlyParties = (year) => api.get(`/party/year/${year}`); // ✅ Correct: uses backticks to interpolate `year`
;
// 🔹 GET all parties with non-zero seat_count: /party/nonzero
export const getAllPartiesNonZeroSeats = () => api.get('/party/nonzero');
// 🔹 POST: create new party: /party
export const createParty = (partyData) =>
  api.post('/party', JSON.stringify(partyData));

// 🔹 PUT: update party by ID: /party/{id}
export const updateParty = (id, updatedPartyData) =>
  api.put('/party/${id}, JSON.stringify(updatedPartyData)');

// 🔹 DELETE: delete party by ID: /party/{id}
export const deleteParty = (id) => api.delete('/party/${id}');