import api from './axios'; // axios is pre-configured in src/api/axios.js

// 🔹 GET all party votes: /party-votes
export const getAllPartyVotes = () => api.get('/party-votes');

// 🔹 GET total votes for a specific party across districts and years: /party-votes/total_votes/{party_name}
export const getTotalVotesForParty = (partyName) => api.get('/party-votes/total_votes/${partyName}');

// 🔹 POST: create new party votes entry: /party-votes
// Backend expects: district_election_id=X&party_id=Y&votes=Z (application/x-www-form-urlencoded)
export const createPartyVotes = (partyVotesData) => {
  // partyVotesData should be an object like { district_election_id: 1, party_id: 2, votes: 100 }
  // We need to convert this to a URL-encoded string
  const formData = new URLSearchParams();
  formData.append('district_election_id', partyVotesData.district_election_id);
  formData.append('party_id', partyVotesData.party_id);
  formData.append('votes', partyVotesData.votes);

  return api.post('/party-votes', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};