import React, { useState,useEffect } from 'react';
import { useElectionStore } from '../store/electionStore';
// import { getDistrictsByProvince } from '../api'; // <-- Add this import
import { getAllProvinces, getDistrictsByProvince } from '../api/ProvinceService'; // <-- Use API for provinces/districts
// import { getProvinces, getDistrictsByProvince } from '../api/DistrictElectionService'; // <-- Use API for provinces/districts
import { getAvailableElectionYears } from '../api/ElectionService'; // <-- Import correct API

import { yearlyParties } from '../api/PartyService'; // <-- Import PartyService

import {
  PieChart,
  BarChart,
  Edit,
  Save,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Type definitions for JS (for reference only)
/**
 * @typedef {Object} District
 * @property {string} id
 * @property {string} name
 * @property {number} seatAllocation
 */

/**
 * @typedef {Object} Province
 * @property {string} id
 * @property {string} name
 * @property {District[]} districts
 */

/**
 * @typedef {Object} DistrictDetails
 * @property {Province} province
 * @property {District} district
 */

const ResultsPage = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    currentYear,
    setCurrentYear,
    results,
    updateDistrictResult
  } = useElectionStore();
  const navigate = useNavigate();

  // Local state
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [voteData, setVoteData] = useState({});
  const [expandedProvinces, setExpandedProvinces] = useState({});
  // New state to store districts per province
  const [provinceDistricts, setProvinceDistricts] = useState({});
  // Remove provinces from store for sidebar
  // const { provinces, ... } = useElectionStore();

  // Local state for API-fetched provinces
  const [apiProvinces, setApiProvinces] = useState([]);
  // New state for available years from DB
  const [availableYears, setAvailableYears] = useState([]);
  // New state for API-fetched parties
  const [apiParties, setApiParties] = useState([]);

  // Remove old availableYears logic
  // const availableYears = Array.isArray(results)
  //   ? results.map(r => r.year).sort((a, b) => a - b)
  //   : [];

  // Get current year results
  const currentYearResults = Array.isArray(results)
    ? results.find(r => r.year === currentYear)
    : null;

  // Handle year change
  const handleYearChange = (e) => {
    setCurrentYear(Number(e.target.value));
    setSelectedDistrict(null);
    setSelectedProvince(null);
    setEditMode(false);
  };

  // Handle province click
  const handleProvinceClick = async (provinceId) => {
    setExpandedProvinces(prev => ({
      ...prev,
      [provinceId]: !prev[provinceId]
    }));

    if (!provinceDistricts[provinceId]) {
      // Fetch districts for this province
      try {
        const districts = await getDistrictsByProvince(provinceId);
        setProvinceDistricts(prev => ({
          ...prev,
          [provinceId]: districts
        }));
      } catch (e) {
        // Optionally handle error
      }
    }

    if (selectedProvince === provinceId) {
      setSelectedProvince(null);
      setSelectedDistrict(null);
    } else {
      setSelectedProvince(provinceId);
      setSelectedDistrict(null);
    }

    setEditMode(false);
  };

  // Handle district click
  const handleDistrictClick = (districtId) => {
    if (selectedDistrict === districtId) {
      setSelectedDistrict(null);
    } else {
      setSelectedDistrict(districtId);
    }

    setEditMode(false);

    // If we have a district selected, load the vote data for editing
    if (currentYearResults) {
      const districtResult = currentYearResults.districtResults.find(
        dr => dr.districtId === districtId
      );

      if (districtResult) {
        // Remove TypeScript type annotation for JS file
        const voteObj = {};
        districtResult.partyResults.forEach(pr => {
          voteObj[pr.partyId] = pr.votes;
        });

        setVoteData(voteObj);
      }
    }
  };

  // Handle vote input change
  const handleVoteChange = (partyId, value) => {
    const numValue = parseInt(value, 10) || 0;
    setVoteData(prev => ({
      ...prev,
      [partyId]: numValue
    }));
  };

  // Handle save votes
  const handleSaveVotes = () => {
    if (!currentYearResults || !selectedDistrict) return;

    // Update each party's votes
    Object.entries(voteData).forEach(([partyId, votes]) => {
      updateDistrictResult(currentYear, selectedDistrict, partyId, votes);
    });

    // Exit edit mode
    setEditMode(false);
  };

  // Get district results
  const districtResults = React.useMemo(() => {
    if (!currentYearResults || !selectedDistrict) return null;
    return currentYearResults.districtResults?.find(
      dr => dr.districtId === selectedDistrict
    );
  }, [currentYearResults, selectedDistrict]);

  // Get district details
  const districtDetails = React.useMemo(() => {
    if (!selectedDistrict) return null;

    let found = null;
    apiProvinces.forEach(province => {
      const district = (province.districts || []).find(d => d.id === selectedDistrict);
      if (district) {
        found = {
          province,
          district
        };
      }
    });

    return found;
  }, [selectedDistrict, apiProvinces]);

  // New: Color map for parties
  const [partyColorMap, setPartyColorMap] = useState({});

  // Utility to generate a random color (hex) based on a string seed
  function getRandomColor(seed) {
    if (!seed || typeof seed !== 'string') {
      return '#cccccc'; // fallback color for invalid input
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  }

  // Build unique color map for all parties (by id)
  useEffect(() => {
    if (apiParties.length > 0) {
      const colorMap = {};
      apiParties.forEach(party => {
        colorMap[party.id] = party.color || getRandomColor(party.id);
      });
      setPartyColorMap(colorMap);
    }
  }, [apiParties]);

  // Calculate national summary by party
  const nationalSummary = React.useMemo(() => {
    if (!currentYearResults) return [];

    const summary = {};

    // Initialize summary for all parties (use apiParties)
    apiParties.forEach(party => {
      summary[party.id] = {
        partyId: party.id,
        totalVotes: 0,
        totalSeats: 0,
        color: partyColorMap[party.id] || getRandomColor(party.id),
        name: party.name,
        shortName: party.shortName
      };
    });

    // Sum up votes and seats by party
    (currentYearResults.districtResults || []).forEach(districtResult => {
      (districtResult.partyResults || []).forEach(partyResult => {
        if (summary[partyResult.partyId]) {
          summary[partyResult.partyId].totalVotes += partyResult.votes || 0;
          summary[partyResult.partyId].totalSeats += partyResult.totalSeats || 0;
        }
      });
    });

    // Convert to array and sort by votes
    return Object.values(summary)
      .filter(item => item.totalVotes > 0)
      .sort((a, b) => b.totalVotes - a.totalVotes);
  }, [currentYearResults, apiParties, partyColorMap]);

  // Pie chart data (use partyColorMap)
  const pieChartData = React.useMemo(() => {
    if (!districtResults) return nationalSummary;

    return (districtResults.partyResults || []).map(pr => {
      const party = apiParties.find(p => p.id === pr.partyId);
      return {
        partyId: pr.partyId,
        name: party?.name || 'Unknown',
        shortName: party?.shortName || 'Unknown',
        color: partyColorMap[pr.partyId] || getRandomColor(pr.partyId),
        value: pr.votes || 0
      };
    }).sort((a, b) => b.value - a.value);
  }, [districtResults, apiParties, nationalSummary, partyColorMap]);

  // Fetch provinces, years, and parties from API on mount
  useEffect(() => {
    getAllProvinces()
      .then((res) => {
        setApiProvinces(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch provinces", err);
      });

    getAvailableElectionYears()
      .then((res) => {
        setAvailableYears(res.data.sort((a, b) => a - b));
      })
      .catch((err) => {
        console.error("Failed to fetch election years", err);
      });
  }, []);

  // Fetch parties for the selected year
  useEffect(() => {
    if (currentYear) {
      yearlyParties(currentYear)
        .then((res) => {
          setApiParties(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch parties", err);
        });
    }
  }, [currentYear]);

  return (
    <div className="min-h-screen bg-[#FDFAF6] py-6">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="px-8 py-3 bg-gradient-to-r from-[#3B1E54] to-[#8E5CC9] text-white font-bold text-xl rounded-full hover:opacity-90 transition-colors appearance-none pr-16"
              >
                const uniqueYears = [...new Set(years)];

                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year} General Election Results
                  </option>
                ))}
              </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Provinces and Districts */}
          
          <div className="lg:col-span-3 h-full">
            <div className="bg-[#f0f7ff] rounded-lg shadow-md overflow-hidden h-full">
              <div className="p-4 bg-gradient-to-r from-[#9574BD] to-[#B296D3] text-black font-medium text-center">
                Provinces & Districts
              </div>
              <div>
                {apiProvinces.map(province => (
                  <div key={province.id}>
                    <button
                      className={`w-full text-left p-4 flex items-center justify-between hover:bg-[#EBE5F2] transition-colors cursor-pointer ${selectedProvince === province.id ? 'bg-[#C0A9DA]' : ''}`}
                      onClick={() => handleProvinceClick(province.id)}
                    >
                      <span className="font-medium">{province.name}</span>
                      {expandedProvinces[province.id] ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white" />
                      )}
                    </button>

                    {/* District list */}
                    {expandedProvinces[province.id] && (
                      <div>
                        {(Array.isArray(provinceDistricts[province.id])
                          ? provinceDistricts[province.id]
                          : provinceDistricts[province.id]?.data || []).map(district => (
                          <button
                            key={district.id}
                            onClick={() => handleDistrictClick(district.id)}
                            className={`w-full text-left px-6 py-3 hover:bg-[#EBE5F2] transition-colors ${selectedDistrict === district.id ? 'bg-[#C0A9DA]' : ''}`}
                          >
                            {district.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-6 h-full">
            <div className="bg-[#f0f7ff] rounded-lg shadow-md p-6 h-full">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center flex items-center justify-center">
                {selectedDistrict && districtDetails
                  ? `${districtDetails?.district?.name} District Results`
                  : `${currentYear} Sri Lanka Results Dashboard`}
              </h2>

              {/* --- Party color legend under dashboard title --- */}
              {!selectedDistrict && (
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {apiParties.map((party) => (
                    <div key={party.id} className="flex items-center">
                      <div
                        className="w-4 h-4 mr-2 rounded"
                        style={{
                          backgroundColor: partyColorMap[party.id] || getRandomColor(party.id),
                          border: '1px solid #ddd'
                        }}
                      />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{party.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* --- End Party color legend --- */}

              {!selectedDistrict && (
                <div className="text-center mb-8">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={nationalSummary}
                          dataKey="totalVotes"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={140}
                          labelLine={false}
                          // Remove label to show only color slices
                          label={() => ""}
                        >
                          {nationalSummary.map((entry) => (
                            <Cell
                              key={entry.partyId}
                              fill={partyColorMap[entry.partyId] || getRandomColor(entry.partyId)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const party = nationalSummary.find(p => p.name === name);
                            return [
                              `${Number(value).toLocaleString()} Valid Votes`,
                              party ? party.name : name
                            ];
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {nationalSummary.map((entry) => (
                          <div key={entry.partyId} className="flex items-center">
                            <div
                          className="w-4 h-4 mr-2"
                          style={{ 
                            backgroundColor: entry.color,
                            border: '1px solid #ddd'
                          }}
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">{entry.name}</span>
                          </div>
                        ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Select a district from the sidebar to view detailed results
                  </p>
                </div>
              )}

              {selectedDistrict && districtResults && districtDetails && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-base font-bold text-gray-800 mb-2 px-1">
                        {districtDetails?.province?.name}
                      </p>
                      <p className="text-lg font-medium">
                        Total Valid Votes: {districtResults.validVotes.toLocaleString()}
                      </p>
                      <div className="space-y-1 mt-2">
                      <p className="text-sm text-gray-600">
                          Qualify Votes: {districtResults.validVotes.toLocaleString()} |
                          Disqualify Votes: {districtResults.invalidVotes.toLocaleString()}
                        ({((districtResults.invalidVotes / districtResults.totalVotes) * 100).toFixed(1)}%)
                      </p>
                        <p className="text-sm text-gray-600">
                          Threshold (5%) Votes: {Math.ceil(districtResults.validVotes * 0.05).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {isAuthenticated && (
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={`btn ${editMode ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-[#8E5CC9] via-[#9B7EBD] to-[#D4BEE4] hover:bg-[#9B7EBD]'} text-white rounded-md px-4 py-2 transition-colors`}
                      >
                        {editMode ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Results
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="h-[400px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="shortName"
                          cx="50%"
                          cy="50%"
                          outerRadius={160}
                          labelLine={false}
                          label={({ x, y }) => (
                            <text
                              x={x}
                              y={y + 15}
                              textAnchor="middle"
                              fill="#666"
                              fontSize={12}
                            >
                              {""}
                            </text>
                          )}
                        >
                          {pieChartData.map((entry) => (
                            <Cell
                              key={entry.partyId}
                              fill={partyColorMap[entry.partyId] || getRandomColor(entry.partyId)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const party = pieChartData.find(p => p.shortName === name);
                            return [
                              `${Number(value).toLocaleString()} votes`,
                              party ? party.name : name
                            ];
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {pieChartData.map((entry) => (
                          <div key={entry.partyId} className="flex items-center">
                            <div
                          className="w-4 h-4 mr-2"
                          style={{ 
                            backgroundColor: entry.color,
                            border: '1px solid #ddd'
                          }}
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">{entry.shortName}</span>
                          </div>
                        ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar - Vote Summary / Edit Panel */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-[#f0f7ff] rounded-lg shadow-md overflow-hidden h-full">
              <div className="p-4 bg-gradient-to-r from-[#9574BD] to-[#B296D3] text-black font-medium text-center">
                All-Island Summary
              </div>
              <div className="divide-y divide-gray-200">
                {currentYearResults && (
                  <div className="p-4">
                    <div className="text-sm font-bold text-gray-700 mb-2">
                      Total Valid Votes: {currentYearResults.totalValidVotes?.toLocaleString?.() ?? 0}
                    </div>
                    <div className="text-sm font-bold text-gray-700 mb-4">
                      Total Seat Count: {nationalSummary.reduce((total, party) => total + (party.totalSeats || 0), 0).toLocaleString()}
                    </div>

                    <h3 className="text-md font-semibold mb-3 text-center">Party Vote Share</h3>
                    <div className="space-y-3">
                      {nationalSummary.slice(0, 5).map(party => (
                        <div key={party.partyId} className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: party.color }}
                          ></div>
                          <div className="text-sm font-medium text-gray-900 w-24">
                            {party.shortName}
                          </div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(party.totalVotes / currentYearResults.totalValidVotes) * 100}%`,
                                backgroundColor: party.color
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 ml-2 w-14 text-right">
                            {((party.totalVotes / currentYearResults.totalValidVotes) * 100).toFixed(1)}%
                          </div>
                          </div>
                        ))}
                    </div>

                    <h3 className="text-md font-semibold mt-12 mb-3 text-center">Seat Allocation</h3>
                    <div className="space-y-3">
                      {nationalSummary.slice(0, 5).map(party => {
                        const totalSeats = party.totalSeats;
                        const totalAllSeats = nationalSummary.reduce((sum, p) => sum + p.totalSeats, 0);
                        const seatPercentage = (totalSeats / totalAllSeats) * 100;
                        
                        return (
                          <div key={party.partyId} className="flex items-center gap-3">
                            <div className="flex items-center min-w-[100px]">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: party.color }}
                              />
                              <div className="text-sm font-medium text-gray-900">
                                {party.shortName}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${seatPercentage}%`,
                                    backgroundColor: party.color
                                  }}
                                />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 font-bold min-w-[100px] text-right">
                              {totalSeats} seats ({seatPercentage.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seat Allocation Section in New Row */}
        {selectedDistrict && districtResults && !editMode && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-center">Seat Allocation</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Party
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Votes
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Bonus Round
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                1st Round
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                2nd Round
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Seats
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(districtResults.partyResults || [])
                              .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                              .map(partyResult => {
                                const party = apiParties.find(p => p.id === partyResult.partyId);
                                return (
                                  <tr key={partyResult.partyId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div
                                          className="w-4 h-4 rounded-full mr-2"
                                          style={{ backgroundColor: party?.color || '#000' }}
                                        ></div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {party?.name || 'Unknown'}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {(partyResult.votes ?? 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {partyResult.bonusSeat ? 1 : 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {partyResult.seatsFirstRound ?? 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {partyResult.seatsSecondRound ?? 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {partyResult.totalSeats ?? 0}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {(districtResults.disqualifiedParties || []).length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-md font-semibold mb-2">Disqualified Parties</h4>
                          <p className="text-sm text-gray-600">
                            Parties with less than 5% of valid votes:
                            {(districtResults.disqualifiedParties || []).map(partyId => {
                              const party = apiParties.find(p => p.id === partyId);
                              return party ? ` ${party.name},` : '';
                            })}
                          </p>
                        </div>
                      )}
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default ResultsPage;