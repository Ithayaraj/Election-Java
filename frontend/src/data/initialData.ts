// Type definitions
export interface Province {
  id: string;
  name: string;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  seatAllocation: number;
}

export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export interface PartyResult {
  partyId: string;
  votes: number;
  seatsFirstRound: number;
  seatsSecondRound: number;
  bonusSeat: boolean;
  totalSeats: number;
}

export interface DistrictResult {
  districtId: string;
  totalVotes: number;
  invalidVotes: number;
  validVotes: number;
  partyResults: PartyResult[];
  disqualifiedParties: string[];
}

export interface ElectionResult {
  year: number;
  totalVotes: number;
  totalInvalidVotes: number;
  totalValidVotes: number;
  districtResults: DistrictResult[];
}

// Initial data
export const initialProvinces: Province[] = [
  {
    id: 'western',
    name: 'WesternProvince',
    districts: [
      { id: 'colombo', name: 'Colombo', seatAllocation: 19 },
      { id: 'gampaha', name: 'Gampaha', seatAllocation: 18 },
      { id: 'kalutara', name: 'Kalutara', seatAllocation: 11 }
    ]
  },
  {
    id: 'central',
    name: 'CentralProvince',
    districts: [
      { id: 'kandy', name: 'Kandy', seatAllocation: 16 },
      { id: 'matale', name: 'Matale', seatAllocation: 8 },
      { id: 'nuwaraeliya', name: 'Nuwara Eliya', seatAllocation: 9 }
    ]
  },
  {
    id: 'southern',
    name: 'SouthernProvince',
    districts: [
      { id: 'galle', name: 'Galle', seatAllocation: 12 },
      { id: 'matara', name: 'Matara', seatAllocation: 8 },
      { id: 'hambantota', name: 'Hambantota', seatAllocation: 11 }
    ]
  },
  {
    id: 'northern',
    name: 'NorthernProvince',
    districts: [
      { id: 'jaffna', name: 'Jaffna', seatAllocation: 10 },
      { id: 'kilinochchi', name: 'Kilinochchi', seatAllocation: 5 },
      { id: 'mannar', name: 'Mannar', seatAllocation: 5 },
      { id: 'vavuniya', name: 'Vavuniya', seatAllocation: 6 },
      { id: 'mullaitivu', name: 'Mullaitivu', seatAllocation: 5 }
    ]
  },
  {
    id: 'eastern',
    name: 'EasternProvince',
    districts: [
      { id: 'batticaloa', name: 'Batticaloa', seatAllocation: 9 },
      { id: 'ampara', name: 'Ampara', seatAllocation: 11 },
      { id: 'trincomalee', name: 'Trincomalee', seatAllocation: 8 }
    ]
  },
  {
    id: 'northwestern',
    name: 'NorthWesternProvince',
    districts: [
      { id: 'kurunegala', name: 'Kurunegala', seatAllocation: 15 },
      { id: 'puttalam', name: 'Puttalam', seatAllocation: 10 }
    ]
  },
  {
    id: 'northcentral',
    name: 'NorthCentralProvince',
    districts: [
      { id: 'anuradhapura', name: 'Anuradhapura', seatAllocation: 12 },
      { id: 'polonnaruwa', name: 'Polonnaruwa', seatAllocation: 7 }
    ]
  },
  {
    id: 'uva',
    name: 'UvaProvince',
    districts: [
      { id: 'badulla', name: 'Badulla', seatAllocation: 11 },
      { id: 'monaragala', name: 'Monaragala', seatAllocation: 7 }
    ]
  },
  {
    id: 'sabaragamuwa',
    name: 'SabaragamuwaProvince',
    districts: [
      { id: 'ratnapura', name: 'Ratnapura', seatAllocation: 10 },
      { id: 'kegalle', name: 'Kegalle', seatAllocation: 11 }
    ]
  }
];

export const initialParties: Party[] = [
  { id: 'unp', name: 'United National Party', shortName: 'UNP', color: '#909d54' },
  { id: 'slfp', name: 'Sri Lanka Freedom Party', shortName: 'SLFP', color: '#5aa176' },
  { id: 'jvp', name: 'Janatha Vimukthi Peramuna', shortName: 'JVP', color: '#91abed' },
  { id: 'tna', name: 'Tamil National Alliance', shortName: 'TNA', color: '#ce9bdc' },
  { id: 'itak', name: 'Ilankai Tamil Arasu Kadchi', shortName: 'ITAK', color: '#009a6a' },
  { id: 'epdp', name: 'Eelam People\'s Democratic Party', shortName: 'EPDP', color: '#678AF4' },
  { id: 'actc', name: 'All Ceylon Tamil Congress', shortName: 'ACTC', color: '#BF6CE9' },
  { id: 'mna', name: 'Muslim National Alliance', shortName: 'MNA', color: '#969792' },
  { id: 'nc', name: 'National Congress', shortName: 'NC', color: '#CA7842' }
];

// Generate random vote counts for a district
const generateDistrictVotes = (totalSeats: number, parties: Party[]): DistrictResult => {
  const partyResults: PartyResult[] = [];
  const totalVotes = Math.floor(Math.random() * 300000) + 100000; // Random total votes between 100,000 and 400,000
  const invalidVotePercentage = Math.random() * 0.03 + 0.02; // 2-5% invalid votes
  const invalidVotes = Math.floor(totalVotes * invalidVotePercentage);
  const validVotes = totalVotes - invalidVotes;

  // Distribute votes among parties
  let remainingVotes = validVotes;

  parties.forEach((party, index) => {
    // Last party gets all remaining votes
    if (index === parties.length - 1) {
      partyResults.push({
        partyId: party.id,
        votes: remainingVotes,
        seatsFirstRound: 0, // Will be calculated later
        seatsSecondRound: 0, // Will be calculated later
        bonusSeat: false, // Will be calculated later
        totalSeats: 0 // Will be calculated later
      });
      return;
    }

    // Random percentage of remaining votes for this party (more for first parties)
    const voteShare = Math.random() * 0.3 + (index === 0 ? 0.2 : index === 1 ? 0.15 : 0.05);
    const votes = Math.floor(remainingVotes * voteShare);
    remainingVotes -= votes;

    partyResults.push({
      partyId: party.id,
      votes,
      seatsFirstRound: 0, // Will be calculated later
      seatsSecondRound: 0, // Will be calculated later
      bonusSeat: false, // Will be calculated later
      totalSeats: 0 // Will be calculated later
    });
  });

  // Calculate seat allocation (simplified for now)
  // In a real implementation, this would use the algorithm described in the requirements
  const disqualifiedParties: string[] = [];

  // Simple approach: allocate seats proportionally for now
  const totalPartyVotes = partyResults.reduce((sum, pr) => sum + pr.votes, 0);

  // Determine highest vote party for bonus seat
  let highestVotePartyIndex = 0;
  for (let i = 1; i < partyResults.length; i++) {
    if (partyResults[i].votes > partyResults[highestVotePartyIndex].votes) {
      highestVotePartyIndex = i;
    }
  }

  // Assign bonus seat
  partyResults[highestVotePartyIndex].bonusSeat = true;

  // Allocate remaining seats proportionally (simplified)
  const remainingSeats = totalSeats - 1; // -1 for bonus seat
  let allocatedSeats = 0;

  for (let i = 0; i < partyResults.length; i++) {
    if (i === partyResults.length - 1) {
      // Last party gets all remaining seats
      partyResults[i].seatsFirstRound = remainingSeats - allocatedSeats;
    } else {
      const seatShare = Math.floor((partyResults[i].votes / totalPartyVotes) * remainingSeats);
      partyResults[i].seatsFirstRound = seatShare;
      allocatedSeats += seatShare;
    }

    // Update total seats
    partyResults[i].totalSeats = partyResults[i].seatsFirstRound +
      (partyResults[i].bonusSeat ? 1 : 0) +
      partyResults[i].seatsSecondRound;
  }

  return {
    districtId: '', // Will be set by the caller
    totalVotes,
    invalidVotes,
    validVotes,
    partyResults,
    disqualifiedParties
  };
};

// Generate initial election results
export const generateInitialResults = (provinces: Province[], parties: Party[]): ElectionResult[] => {
  // Generate results for 2010, 2015, 2020, and 2025
  const years = [2010, 2015, 2020, 2025];

  return years.map(year => {
    let totalVotes = 0;
    let totalInvalidVotes = 0;
    const districtResults: DistrictResult[] = [];

    // Generate results for each district
    provinces.forEach(province => {
      province.districts.forEach(district => {
        const result = generateDistrictVotes(district.seatAllocation, parties);
        result.districtId = district.id;

        totalVotes += result.totalVotes;
        totalInvalidVotes += result.invalidVotes;

        districtResults.push(result);
      });
    });

    return {
      year,
      totalVotes,
      totalInvalidVotes,
      totalValidVotes: totalVotes - totalInvalidVotes,
      districtResults
    };
  });
};