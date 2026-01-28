import React, { useState } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Save, ArrowRight } from 'lucide-react';

const ResultsManagement: React.FC = () => {
  const { 
    currentYear, 
    setCurrentYear, 
    provinces, 
    parties, 
    results,
    updateDistrictResult,
    calculatedDistrictResult
  } = useElectionStore();
  
  // Local state
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [voteData, setVoteData] = useState<Record<string, number>>({});
  const [formChanged, setFormChanged] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Get available years from results
  const availableYears = results.map(r => r.year).sort((a, b) => a - b);
  
  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (formChanged && !window.confirm('You have unsaved changes. Are you sure you want to change the year?')) {
      return;
    }
    setCurrentYear(Number(e.target.value));
    resetSelections();
  };
  
  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (formChanged && !window.confirm('You have unsaved changes. Are you sure you want to change the province?')) {
      return;
    }
    setSelectedProvince(e.target.value);
    setSelectedDistrict('');
    setVoteData({});
    setFormChanged(false);
  };
  
  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (formChanged && !window.confirm('You have unsaved changes. Are you sure you want to change the district?')) {
      return;
    }
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    
    // Load vote data for the selected district
    if (districtId) {
      const currentYearResults = results.find(r => r.year === currentYear);
      if (currentYearResults) {
        const districtResult = currentYearResults.districtResults.find(
          dr => dr.districtId === districtId
        );
        
        if (districtResult) {
          const voteObj: Record<string, number> = {};
          districtResult.partyResults.forEach(pr => {
            voteObj[pr.partyId] = pr.votes;
          });
          
          // Initialize any missing parties with 0 votes
          parties.forEach(party => {
            if (voteObj[party.id] === undefined) {
              voteObj[party.id] = 0;
            }
          });
          
          setVoteData(voteObj);
        } else {
          // No existing data, initialize with zeros
          const voteObj: Record<string, number> = {};
          parties.forEach(party => {
            voteObj[party.id] = 0;
          });
          setVoteData(voteObj);
        }
      }
    } else {
      setVoteData({});
    }
    
    setFormChanged(false);
  };
  
  // Handle vote input change
  const handleVoteChange = (partyId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setVoteData(prev => ({
      ...prev,
      [partyId]: numValue
    }));
    setFormChanged(true);
  };
  
  // Reset selections
  const resetSelections = () => {
    setSelectedProvince('');
    setSelectedDistrict('');
    setVoteData({});
    setFormChanged(false);
  };
  
  // Handle save votes
  const handleSaveVotes = () => {
    if (!selectedDistrict) return;
    
    // Update each party's votes
    Object.entries(voteData).forEach(([partyId, votes]) => {
      updateDistrictResult(currentYear, selectedDistrict, partyId, votes);
    });
    
    setFormChanged(false);
    
    // Show success message
    alert('Vote data saved successfully!');
  };
  
  // Get district list for selected province
  const districtList = React.useMemo(() => {
    if (!selectedProvince) return [];
    const province = provinces.find(p => p.id === selectedProvince);
    return province ? province.districts : [];
  }, [selectedProvince, provinces]);
  
  // Get current district details
  const currentDistrict = React.useMemo(() => {
    if (!selectedDistrict) return null;
    
    for (const province of provinces) {
      const district = province.districts.find(d => d.id === selectedDistrict);
      if (district) {
        return district;
      }
    }
    
    return null;
  }, [selectedDistrict, provinces]);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Latest Update</h2>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        
        {selectedDistrict && currentDistrict && (
          <div>
            <div className="bg-blue-50 rounded-md p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Edit Vote Data for {currentDistrict.name} ({currentYear})
              </h3>
              <p className="text-sm text-gray-600">
                Enter the vote counts for each party in this district. 
                The system will automatically calculate seat allocations based on these values.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {parties.map(party => (
                <div key={party.id} className="flex items-center space-x-3 bg-white p-4 rounded-md border border-gray-200">
                  <div 
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: party.color }}
                  ></div>
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700">
                      {party.name} ({party.shortName})
                    </label>
                    <input
                      type="number"
                      value={voteData[party.id] || 0}
                      onChange={(e) => handleVoteChange(party.id, e.target.value)}
                      min="0"
                      className="form-input w-full mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveVotes}
                className="btn btn-primary"
                disabled={!formChanged}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Vote Data
              </button>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search parties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B7EBD]"
          />
        </div>

        {/* Display Calculation Results */}
        {calculatedDistrictResult && (
          <div className="mt-8 bg-[#f0f7ff] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Latest Calculation Results ({calculatedDistrictResult.districtName})</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Valid Votes</p>
                <p className="text-2xl font-bold">
                  {calculatedDistrictResult.validVotes.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invalid Votes</p>
                <p className="text-2xl font-bold">
                  {calculatedDistrictResult.invalidVotes.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Seats</p>
                <p className="text-2xl font-bold">
                  {calculatedDistrictResult.totalSeats}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">5% Threshold</p>
                <p className="text-2xl font-bold">
                  {calculatedDistrictResult.thresholdVotes.toLocaleString()} votes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Votes per Seat</p>
                <p className="text-2xl font-bold">
                  {calculatedDistrictResult.votesPerSeat.toLocaleString()} votes
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qualify
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bonus Seat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Round
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Second Round
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Seats
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedDistrictResult.partyResults
                    .filter((result: any) => {
                      const party = parties.find(p => p.id === result.partyId);
                      const lowerSearchTerm = searchTerm.toLowerCase();
                      return (
                        party?.name.toLowerCase().includes(lowerSearchTerm) ||
                        party?.shortName.toLowerCase().includes(lowerSearchTerm)
                      );
                    })
                    .map((result: any) => {
                      const party = parties.find(p => p.id === result.partyId);
                      return (
                        <tr key={result.partyId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: party?.color }}
                              ></div>
                              <div className="text-sm font-medium text-gray-900">
                                {party?.shortName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.votes.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.qualifies
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {result.qualifies ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.bonusSeat ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.seatsFirstRound || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.seatsSecondRound || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.totalSeats}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsManagement;