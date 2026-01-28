import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  LineChart,
  PieChart,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { useElectionStore } from '../store/electionStore';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentYear,
    setCurrentYear,
    results,
    parties,
    provinces
  } = useElectionStore();

  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  // Get available years from results
  const availableYears = results.map(r => r.year).sort((a, b) => a - b);

  // Get current year results
  const currentYearResults = results.find(r => r.year === currentYear);

  // Calculate national summary by party
  const nationalSummary = React.useMemo(() => {
    if (!currentYearResults) return [];

    const summary: Record<string, {
      partyId: string,
      totalVotes: number,
      totalSeats: number,
      color: string,
      name: string,
      shortName: string
    }> = {};

    // Initialize summary for all parties
    parties.forEach(party => {
      summary[party.id] = {
        partyId: party.id,
        totalVotes: 0,
        totalSeats: 0,
        color: party.color,
        name: party.name,
        shortName: party.shortName
      };
    });

    // Sum up votes and seats by party
    currentYearResults.districtResults.forEach(districtResult => {
      districtResult.partyResults.forEach(partyResult => {
        if (summary[partyResult.partyId]) {
          summary[partyResult.partyId].totalVotes += partyResult.votes;
          summary[partyResult.partyId].totalSeats += partyResult.totalSeats;
        }
      });
    });

    // Define the order of parties
    const partyOrder = ['UNP', 'SLFP', 'NC', 'JVP', 'TNA', 'ITAK', 'EPDP', 'ACTC', 'MNA'];

    // Convert to array and sort by the defined order
    return Object.values(summary)
      .filter(item => item.totalVotes > 0)
      .sort((a, b) => {
        const indexA = partyOrder.indexOf(a.shortName);
        const indexB = partyOrder.indexOf(b.shortName);
        return indexA - indexB;
      });
  }, [currentYearResults, parties]);

  // Calculate vote trend data for line chart
  const voteTrendData = React.useMemo(() => {
    const trendData: { year: number, [key: string]: number }[] = [];

    availableYears.forEach(year => {
      const yearResult = results.find(r => r.year === year);
      if (!yearResult) return;

      const yearData: { year: number, [key: string]: number } = { year };

      // Calculate total votes by party for this year
      const partyVotes: Record<string, number> = {};

      yearResult.districtResults.forEach(districtResult => {
        districtResult.partyResults.forEach(partyResult => {
          if (!partyVotes[partyResult.partyId]) {
            partyVotes[partyResult.partyId] = 0;
          }
          partyVotes[partyResult.partyId] += partyResult.votes;
        });
      });

      // Add to year data
      Object.entries(partyVotes).forEach(([partyId, votes]) => {
        yearData[partyId] = votes;
      });

      trendData.push(yearData);
    });

    return trendData;
  }, [results, availableYears]);

  // Calculate vote difference compared to previous election
  const voteDifference = React.useMemo(() => {
    if (availableYears.length < 2) return [];

    const currentIndex = availableYears.indexOf(currentYear);
    if (currentIndex <= 0) return []; // No previous year to compare

    const previousYear = availableYears[currentIndex - 1];

    const previousYearResults = results.find(r => r.year === previousYear);
    if (!previousYearResults || !currentYearResults) return [];

    // Calculate previous year summary
    const previousSummary: Record<string, number> = {};

    previousYearResults.districtResults.forEach(districtResult => {
      districtResult.partyResults.forEach(partyResult => {
        if (!previousSummary[partyResult.partyId]) {
          previousSummary[partyResult.partyId] = 0;
        }
        previousSummary[partyResult.partyId] += partyResult.votes;
      });
    });

    // Calculate differences
    return nationalSummary
      .map(party => {
        const previousVotes = previousSummary[party.partyId] || 0;
        const difference = party.totalVotes - previousVotes;
        const percentageChange = previousVotes === 0
          ? 100
          : (difference / previousVotes) * 100;

        return {
          ...party,
          difference,
          percentageChange,
          previousVotes
        };
      })
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [currentYear, availableYears, results, nationalSummary, currentYearResults]);

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(Number(e.target.value));
  };

  // Handle click on party in pie chart
  const handlePartyClick = (partyId: string) => {
    setSelectedParty(selectedParty === partyId ? null : partyId);
  };

  // Calculate party province data if a party is selected
  const selectedPartyData = React.useMemo(() => {
    if (!selectedParty || !currentYearResults) return [];

    const provinceData: {
      provinceId: string,
      provinceName: string,
      votes: number,
      color: string
    }[] = [];

    provinces.forEach(province => {
      let totalVotes = 0;

      // Sum votes for this party in all districts of this province
      province.districts.forEach(district => {
        const districtResult = currentYearResults.districtResults.find(
          dr => dr.districtId === district.id
        );

        if (districtResult) {
          const partyResult = districtResult.partyResults.find(
            pr => pr.partyId === selectedParty
          );

          if (partyResult) {
            totalVotes += partyResult.votes;
          }
        }
      });

      if (totalVotes > 0) {
        provinceData.push({
          provinceId: province.id,
          provinceName: province.name,
          votes: totalVotes,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
        });
      }
    });

    return provinceData.sort((a, b) => b.votes - a.votes);
  }, [selectedParty, currentYearResults, provinces]);

  // Get selected party name and color
  const selectedPartyInfo = selectedParty
    ? parties.find(p => p.id === selectedParty)
    : null;

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {/* Election Selection Section */}
      <div className="py-4 bg-[#FDFAF6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-2 mt-4">
            <div className="relative w-full md:w-[600px] group">
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="appearance-none w-full px-8 py-3 text-2xl bg-white border-2 border-[#8E7DBE] text-[#3B1E54] rounded-2xl cursor-pointer 
                  hover:border-[#F7CFD8] transition-all duration-300 ease-in-out
                  focus:outline-none focus:border-[#F7CFD8] focus:ring-2 focus:ring-[#F7CFD8] focus:ring-opacity-50 
                  text-center font-bold font-poppins shadow-md
                  [&>option]:font-poppins [&>option]:text-xl [&>option]:bg-white [&>option]:text-[#3B1E54] 
                  [&>*]:rounded-xl [&>*]:px-4 [&>*]:py-2
                  [&_optgroup]:bg-white [&_optgroup]:rounded-xl [&_optgroup]:shadow-lg [&_optgroup]:border-[#8E7DBE] [&_optgroup]:border-2"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                <optgroup style={{ 
                  borderRadius: '16px',
                  padding: '8px',
                  margin: '4px',
                  backgroundColor: 'white',
                  border: '2px solid #8E7DBE',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  {availableYears.map(year => (
                    <option 
                      key={year} 
                      value={year}
                      className="text-center font-bold hover:bg-[#F7CFD8] transition-colors duration-200"
                      style={{
                        borderRadius: '12px',
                        margin: '4px 0',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {year} General Election
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E7DBE] group-hover:text-[#F7CFD8] transition-colors">
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <style>{`
                select option {
                  border-radius: 12px !important;
                  margin: 4px 0 !important;
                  padding: 8px 16px !important;
                }
                select option:hover {
                  background-color: #F7CFD8 !important;
                }
                select optgroup {
                  border-radius: 16px !important;
                  padding: 8px !important;
                  margin: 4px !important;
                  background-color: white !important;
                  border: 2px solid #8E7DBE !important;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {currentYearResults && (
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <BarChart className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-600 transition-all duration-300 hover:text-base">Total Valid Votes</p>
                <p className="text-2xl font-bold transition-all duration-300 hover:text-3xl">
                  {(currentYearResults.totalVotes - currentYearResults.totalInvalidVotes).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-600 transition-all duration-300 hover:text-base">Total Seat Allocation</p>
                <p className="text-2xl font-bold transition-all duration-300 hover:text-3xl">
                  {nationalSummary.reduce((total, party) => total + party.totalSeats, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 flex items-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-600 transition-all duration-300 hover:text-base">Leading Party</p>
                <p className="text-2xl font-bold transition-all duration-300 hover:text-3xl">
                  {nationalSummary.length > 0 ? nationalSummary[0].shortName : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* National Results */}
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            {currentYear} National Results
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* National Pie Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-xl pt-4 pb-12 px-8 relative z-10 transform hover:scale-[1.02] transition-transform duration-300">
              <h3 className="text-lg font-semibold mb-2 text-center">
                Vote Distribution
              </h3>
              <div className="h-[520px] flex flex-col items-center -mt-2">
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={nationalSummary}
                        dataKey="totalVotes"
                        nameKey="shortName"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
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
                        onClick={(data) => handlePartyClick(data.partyId)}
                        cursor="pointer"
                      >
                        {nationalSummary.map((entry) => (
                          <Cell
                            key={entry.partyId}
                            fill={entry.color}
                            stroke={selectedParty === entry.partyId ? "#000" : "#fff"}
                            strokeWidth={selectedParty === entry.partyId ? 3 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toLocaleString()} valid votes`,
                          "Valid Votes"
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-20 flex flex-wrap justify-center gap-12 w-full">
                  {nationalSummary.map((entry) => (
                    <div key={entry.partyId} className="flex items-center px-4">
                      <div
                        className="w-3 h-3 mr-2"
                        style={{ 
                          backgroundColor: entry.color,
                          border: selectedParty === entry.partyId ? "2px solid black" : "1px solid white"
                        }}
                      />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{entry.shortName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Historical Vote Trends */}
            {!selectedParty && (
              <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">Historical Vote Trends</h3>
                <div className="h-[520px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={voteTrendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} valid votes`, "Valid Votes"]} />
                      <Legend />
                      {parties
                        .filter(party => {
                          const partyIndex = nationalSummary.findIndex(p => p.partyId === party.id);
                          return partyIndex >= 0 && partyIndex < 5;
                        })
                        .map(party => (
                          <Line
                            key={party.id}
                            type="monotone"
                            dataKey={party.id}
                            name={party.shortName}
                            stroke={party.color}
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                          />
                        ))
                      }
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Province breakdown if party selected */}
            {selectedParty && selectedPartyInfo && (
              <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-center flex items-center justify-center">
                  <span
                    className="inline-block w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: selectedPartyInfo.color }}
                  ></span>
                  {selectedPartyInfo.name} - Provincial Breakdown
                </h3>
                <div className="space-y-4">
                  {selectedPartyData.map((province) => {
                    const percentage = (province.votes / Math.max(...selectedPartyData.map(p => p.votes))) * 100;
                    return (
                      <div key={province.provinceId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{province.provinceName}</span>
                          <span className="text-gray-600">{province.votes.toLocaleString()} Total Valid Votes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="h-4 rounded-full transition-all duration-500 ease-in-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: selectedPartyInfo.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Explore Detailed Election Results */}
        <div className="py-8 mt-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Explore Detailed Election Results
            </h2>
            <p className="text-gray-600 mb-6">
              Dive deeper into the election data with our comprehensive results page.
              Analyze district-level results, seat allocations, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;