import api from './axios'; // axios is pre-configured in src/api/axios.js

// 🔹 GET all seat allocations: /seat_allocation
export const getAllSeatAllocations = () => api.get('/seat_allocation');

// 🔹 GET total seats allocated for a party in a specific year: /seat_allocation/total
// Backend expects JSON: { "party_name": "string", "year": "string" }
export const getTotalSeatsAllocatedByPartyAndYear = (partyName, year) =>
  api.get('/seat_allocation/total', { params: { party_name: partyName, year: year } });
  // Note: The backend handler totalSeatsAllocatedPartyAllDistricts reads from request body for GET.
  // This is unconventional. Standard practice is to use query parameters for GET requests.
  // The 'params' option in axios automatically converts to query string.
  // If the backend strictly expects a JSON body for this GET, this call would need to be:
  // api.get('/seat_allocation/total', { data: { party_name: partyName, year: year } });
  // However, sending a body with GET is not standard and might not be supported by all servers/proxies.

// 🔹 GET seat allocations for a specific party, grouped by year: /seat_allocation/party
// Backend expects JSON: { "party_name": "string" }
export const getSeatAllocationsByParty = (partyName) =>
  api.get('/seat_allocation/party', { params: { party_name: partyName } });
  // Similar to above, backend reads from request body for GET.
  // If backend strictly expects JSON body:
  // api.get('/seat_allocation/party', { data: { party_name: partyName } });

// 🔹 POST: create new seat allocation: /seat_allocation
export const createSeatAllocation = (seatAllocationData) =>
  api.post('/seat_allocation', JSON.stringify(seatAllocationData));

// 🔹 PUT: update seat allocation by ID: /seat_allocation/update/{id}
export const updateSeatAllocation = (id, updatedData) =>
  api.put('/seat_allocation/update/${id}', JSON.stringify(updatedData));

// 🔹 DELETE: delete seat allocation by ID: /seat_allocation/delete/{id}
export const deleteSeatAllocation = (id) => api.delete('/seat_allocation/delete/${id}');