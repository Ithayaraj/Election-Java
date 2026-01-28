import api from './axios'; // axios is pre-configured in src/api/axios.js


export const getAvailableElectionYears = () => api.get('/elections/years');
// 🔹 GET all elections: /election
export const getAllElections = () => api.get('/election');

// 🔹 POST: create new election: /election
// The backend expects a simple integer for the year, either as raw body or "year=YYYY"
export const createElection = (year) => {
  // The backend seems to expect a less typical POST body for this endpoint.
  // It can be either a raw integer string or "year=<year_integer>"
  // For simplicity and consistency with JSON APIs, we'll send it as a JSON object
  // and rely on backend flexibility or expect potential future backend adjustments.
  // If issues arise, this might need to be changed to send 'year.toString()' or year=${year}
  // with 'Content-Type': 'application/x-www-form-urlencoded' or 'text/plain'.
  return api.post('/election', { year });
};