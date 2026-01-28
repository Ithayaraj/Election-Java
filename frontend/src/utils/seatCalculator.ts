import { DistrictResult, PartyResult } from '../data/initialData';

// Calculate invalid votes (5% of total votes)
export const calculateInvalidVotes = (totalVotes: number): number => {
  return Math.floor(totalVotes * 0.05);
};

// Calculate valid votes
export const calculateValidVotes = (totalVotes: number, invalidVotes: number): number => {
  return totalVotes - invalidVotes;
};

// Disqualify parties below threshold (5% of valid votes)
export const disqualifyParties = (
  partyResults: PartyResult[], 
  validVotes: number
): { qualified: PartyResult[], disqualified: string[] } => {
  const threshold = validVotes * 0.05;
  const qualified: PartyResult[] = [];
  const disqualified: string[] = [];
  
  partyResults.forEach(party => {
    if (party.votes >= threshold) {
      qualified.push(party);
    } else {
      disqualified.push(party.partyId);
    }
  });
  
  return { qualified, disqualified };
};

// Calculate seat allocation
export const calculateSeatAllocation = (
  partyResults: PartyResult[], 
  validVotes: number, 
  totalSeats: number
): PartyResult[] => {
  if (partyResults.length === 0) return [];
  
  // Make a copy of party results to avoid modifying the original
  const updatedResults = JSON.parse(JSON.stringify(partyResults)) as PartyResult[];
  
  // Reset seat allocation
  updatedResults.forEach(party => {
    party.seatsFirstRound = 0;
    party.seatsSecondRound = 0;
    party.bonusSeat = false;
    party.totalSeats = 0;
  });
  
  // 1. First round allocation
  const remainingSeats = totalSeats - 1; // One bonus seat
  const quota = validVotes / remainingSeats;
  
  updatedResults.forEach(party => {
    party.seatsFirstRound = Math.floor(party.votes / quota);
  });
  
  // 2. Assign bonus seat to the party with highest votes
  let highestVoteParty = updatedResults[0];
  updatedResults.forEach(party => {
    if (party.votes > highestVoteParty.votes) {
      highestVoteParty = party;
    }
  });
  
  // Find the index of the highest vote party
  const highestVotePartyIndex = updatedResults.findIndex(
    party => party.partyId === highestVoteParty.partyId
  );
  
  // Assign bonus seat
  updatedResults[highestVotePartyIndex].bonusSeat = true;
  
  // 3. Second round allocation (remaining seats based on remainders)
  // Calculate how many seats are allocated in the first round
  const allocatedSeats = updatedResults.reduce(
    (sum, party) => sum + party.seatsFirstRound, 
    0
  );
  
  // Calculate how many seats are left for the second round
  const secondRoundSeats = remainingSeats - allocatedSeats;
  
  if (secondRoundSeats > 0) {
    // Calculate remainders
    const remainders = updatedResults.map(party => ({
      partyId: party.partyId,
      remainder: party.votes % quota,
      index: updatedResults.findIndex(p => p.partyId === party.partyId)
    }));
    
    // Sort by remainder in descending order
    remainders.sort((a, b) => b.remainder - a.remainder);
    
    // Allocate remaining seats
    for (let i = 0; i < secondRoundSeats; i++) {
      if (i < remainders.length) {
        updatedResults[remainders[i].index].seatsSecondRound += 1;
      }
    }
  }
  
  // 4. Calculate total seats
  updatedResults.forEach(party => {
    party.totalSeats = party.seatsFirstRound + 
                      (party.bonusSeat ? 1 : 0) + 
                      party.seatsSecondRound;
  });
  
  return updatedResults;
};

// Process district results to calculate seat allocation
export const processDistrictResults = (
  districtResult: DistrictResult, 
  totalSeats: number
): DistrictResult => {
  // Make a copy to avoid modifying the original
  const result = JSON.parse(JSON.stringify(districtResult)) as DistrictResult;
  
  // Calculate invalid votes if not already set
  if (result.invalidVotes === 0) {
    result.invalidVotes = calculateInvalidVotes(result.totalVotes);
  }
  
  // Calculate valid votes if not already set
  if (result.validVotes === 0) {
    result.validVotes = calculateValidVotes(result.totalVotes, result.invalidVotes);
  }
  
  // Disqualify parties below threshold
  const { qualified, disqualified } = disqualifyParties(
    result.partyResults, 
    result.validVotes
  );
  
  result.disqualifiedParties = disqualified;
  
  // Calculate seat allocation for qualified parties
  if (qualified.length > 0) {
    result.partyResults = calculateSeatAllocation(
      qualified, 
      result.validVotes, 
      totalSeats
    );
  }
  
  return result;
};