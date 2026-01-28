import { create } from 'zustand';
import { 
  Province, 
  District, 
  Party, 
  ElectionResult, 
  DistrictResult,
  initialProvinces,
  initialParties, 
  generateInitialResults
} from '../data/initialData';

interface ElectionState {
  currentYear: number;
  provinces: Province[];
  parties: Party[];
  results: ElectionResult[];
  
  setCurrentYear: (year: number) => void;
  
  // Calculated results state
  calculatedDistrictResult: any | null;
  
  // Province CRUD
  addProvince: (province: Province) => void;
  updateProvince: (id: string, province: Partial<Province>) => void;
  deleteProvince: (id: string) => void;
  
  // District CRUD
  addDistrict: (provinceId: string, district: District) => void;
  updateDistrict: (provinceId: string, districtId: string, district: Partial<District>) => void;
  deleteDistrict: (provinceId: string, districtId: string) => void;
  
  // Party CRUD
  addParty: (party: Party) => void;
  updateParty: (id: string, party: Partial<Party>) => void;
  deleteParty: (id: string) => void;
  
  // Result CRUD
  updateDistrictResult: (
    year: number, 
    districtId: string, 
    partyId: string, 
    votes: number
  ) => void;
  
  // Get results for specific year
  getResultsByYear: (year: number) => ElectionResult | undefined;
  
  // Get district results for specific year and district
  getDistrictResultsByYearAndDistrict: (
    year: number, 
    districtId: string
  ) => DistrictResult | undefined;
  
  // Action to set calculated results
  setCalculatedDistrictResult: (result: any | null) => void;
}

export const useElectionStore = create<ElectionState>((set, get) => ({
  currentYear: 2025,
  provinces: initialProvinces,
  parties: initialParties,
  results: generateInitialResults(initialProvinces, initialParties),
  calculatedDistrictResult: null,
  
  setCurrentYear: (year) => set({ currentYear: year }),
  
  // Province CRUD
  addProvince: (province) => set((state) => ({ 
    provinces: [...state.provinces, province] 
  })),
  
  updateProvince: (id, province) => set((state) => ({
    provinces: state.provinces.map((p) => 
      p.id === id ? { ...p, ...province } : p
    )
  })),
  
  deleteProvince: (id) => set((state) => ({
    provinces: state.provinces.filter((p) => p.id !== id)
  })),
  
  // District CRUD
  addDistrict: (provinceId, district) => set((state) => ({
    provinces: state.provinces.map((p) => 
      p.id === provinceId 
        ? { ...p, districts: [...p.districts, district] } 
        : p
    )
  })),
  
  updateDistrict: (provinceId, districtId, district) => set((state) => ({
    provinces: state.provinces.map((p) => 
      p.id === provinceId 
        ? { 
            ...p, 
            districts: p.districts.map((d) => 
              d.id === districtId ? { ...d, ...district } : d
            ) 
          } 
        : p
    )
  })),
  
  deleteDistrict: (provinceId, districtId) => set((state) => ({
    provinces: state.provinces.map((p) => 
      p.id === provinceId 
        ? { 
            ...p, 
            districts: p.districts.filter((d) => d.id !== districtId) 
          } 
        : p
    )
  })),
  
  // Party CRUD
  addParty: (party) => set((state) => ({ 
    parties: [...state.parties, party] 
  })),
  
  updateParty: (id, party) => set((state) => ({
    parties: state.parties.map((p) => 
      p.id === id ? { ...p, ...party } : p
    )
  })),
  
  deleteParty: (id) => set((state) => ({
    parties: state.parties.filter((p) => p.id !== id)
  })),
  
  // Result CRUD
  updateDistrictResult: (year, districtId, partyId, votes) => set((state) => {
    // Find the election result for the specific year
    const yearIndex = state.results.findIndex(r => r.year === year);
    
    if (yearIndex === -1) return state; // Year not found
    
    // Create a copy of the results array
    const updatedResults = [...state.results];
    
    // Find the district result for the specific district
    const districtIndex = updatedResults[yearIndex].districtResults.findIndex(
      dr => dr.districtId === districtId
    );
    
    if (districtIndex === -1) return state; // District not found
    
    // Find the party result for the specific party
    const partyIndex = updatedResults[yearIndex].districtResults[districtIndex].partyResults.findIndex(
      pr => pr.partyId === partyId
    );
    
    if (partyIndex === -1) {
      // Party not found, add new party result
      updatedResults[yearIndex].districtResults[districtIndex].partyResults.push({
        partyId,
        votes,
        seatsFirstRound: 0,
        seatsSecondRound: 0,
        bonusSeat: false,
        totalSeats: 0
      });
    } else {
      // Update existing party result votes
      updatedResults[yearIndex].districtResults[districtIndex].partyResults[partyIndex].votes = votes;
    }
    
    // Recalculate seats for this district
    // This would call the seat calculation algorithm
    // For now, we'll just return the updated results
    
    return { results: updatedResults };
  }),
  
  // Get results for specific year
  getResultsByYear: (year) => {
    return get().results.find(r => r.year === year);
  },
  
  // Get district results for specific year and district
  getDistrictResultsByYearAndDistrict: (year, districtId) => {
    const yearResults = get().results.find(r => r.year === year);
    if (!yearResults) return undefined;
    
    return yearResults.districtResults.find(dr => dr.districtId === districtId);
  },
  
  // Action to set calculated results
  setCalculatedDistrictResult: (result) => set({ calculatedDistrictResult: result }),
}));