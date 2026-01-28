import React, { useState, useEffect } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Calculator, Save, ArrowRight, Plus, X, Check, Edit } from 'lucide-react';

interface PartyVote {
    partyId: string;
    votes: number;
}

const SeatCalculation: React.FC = () => {
    const {
        currentYear,
        setCurrentYear,
        provinces,
        parties,
        results,
        updateDistrictResult,
        setCalculatedDistrictResult
    } = useElectionStore();

    // Local state
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [calculationResults, setCalculationResults] = useState<any>(null);
    const [totalValidVotes, setTotalValidVotes] = useState<number>(0);
    const [totalInvalidVotes, setTotalInvalidVotes] = useState<number>(0);
    const [partyVotes, setPartyVotes] = useState<PartyVote[]>([]);
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [partyVoteCount, setPartyVoteCount] = useState<number>(0);
    const [districtSeats, setDistrictSeats] = useState<number>(0);
    const [totalPartyCount, setTotalPartyCount] = useState<number>(0);
    const [electionYear, setElectionYear] = useState<number>(currentYear);
    const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
    const [editingVotes, setEditingVotes] = useState<number>(0);
    const partySelectRef = React.useRef<HTMLSelectElement>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [totalVotesUsed, setTotalVotesUsed] = useState<number>(0);
    const [remainingVotes, setRemainingVotes] = useState<number>(0);

    // Get available years from results
    const availableYears = results.map(r => r.year).sort((a, b) => a - b);

    // Handle year change
    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const year = parseInt(e.target.value);
        const currentYear = new Date().getFullYear();
        
        // Only allow current year and past years
        if (year > currentYear) {
            setElectionYear(currentYear);
        } else if (year >= 1900) {
            setElectionYear(year);
        }
    };

    // Handle province change
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvince(e.target.value);
        setSelectedDistrict('');
        setCalculationResults(null);
    };

    // Handle district change
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDistrict(e.target.value);
        setCalculationResults(null);
        // Set district seats when district is selected
        const province = provinces.find(p => p.id === selectedProvince);
        const district = province?.districts.find(d => d.id === e.target.value);
        if (district) {
            setDistrictSeats(district.seatAllocation);
        }
    };

    // Reset selections
    const resetSelections = () => {
        setSelectedProvince('');
        setSelectedDistrict('');
        setCalculationResults(null);
        setTotalValidVotes(0);
        setTotalInvalidVotes(0);
        setPartyVotes([]);
        setDistrictSeats(0);
        setTotalPartyCount(0);
    };

    // Add party vote
    const addPartyVote = () => {
        if (!selectedParty || partyVoteCount <= 0) return;

        // Check if party is already added
        if (partyVotes.some(pv => pv.partyId === selectedParty)) {
            alert('This party has already been added');
            return;
        }

        // Check if we've reached the party count limit
        if (partyVotes.length >= totalPartyCount) {
            alert(`You can only add ${totalPartyCount} parties`);
            return;
        }

        // Check if adding this party's votes exceeds total valid votes
        const currentTotalPartyVotes = partyVotes.reduce((sum, pv) => sum + pv.votes, 0);
        if (currentTotalPartyVotes + partyVoteCount > totalValidVotes) {
            alert(`Adding ${partyVoteCount.toLocaleString()} votes for this party would exceed the total valid votes of ${totalValidVotes.toLocaleString()}. Please enter a lower value.`);
            return;
        }

        setPartyVotes([...partyVotes, { partyId: selectedParty, votes: partyVoteCount }]);
        setSelectedParty('');
        setPartyVoteCount(0);

        // Focus on party select after adding
        setTimeout(() => {
            partySelectRef.current?.focus();
        }, 100);
    };

    // Remove party vote
    const removePartyVote = (partyId: string) => {
        setPartyVotes(partyVotes.filter(pv => pv.partyId !== partyId));
    };

    // Update party votes
    const updatePartyVotes = (partyId: string, newVotes: number) => {
        if (newVotes < 0) return;

        // Calculate total votes if this change is applied
        const votesWithoutCurrentParty = partyVotes.filter(pv => pv.partyId !== partyId).reduce((sum, pv) => sum + pv.votes, 0);
        const newTotalPartyVotes = votesWithoutCurrentParty + newVotes;

        if (newTotalPartyVotes > totalValidVotes) {
            alert(`Updating this party's votes to ${newVotes.toLocaleString()} would cause the total party votes (${newTotalPartyVotes.toLocaleString()}) to exceed the total valid votes (${totalValidVotes.toLocaleString()}). Please enter a lower value.`);
            setEditingVotes(partyVotes.find(pv => pv.partyId === partyId)?.votes || 0); // Revert input to current value
            return;
        }

        setPartyVotes(partyVotes.map(pv =>
            pv.partyId === partyId ? { ...pv, votes: newVotes } : pv
        ));
        setEditingPartyId(null);
    };

    // Start editing party votes
    const startEditingVotes = (partyId: string, currentVotes: number) => {
        setEditingPartyId(partyId);
        setEditingVotes(currentVotes);
    };

    // Calculate seats
    const calculateSeats = () => {
        if (!selectedDistrict || partyVotes.length === 0) return;

        const totalSeats = districtSeats;
        const validVotes = totalValidVotes;

        // Calculate 5% threshold
        const thresholdVotes = Math.floor(validVotes * 0.05);

        // Calculate votes per seat
        const votesPerSeat = Math.floor(validVotes / totalSeats);

        // Calculate seats using the Sri Lankan PR system
        const partyResults = partyVotes.map(pv => ({
            ...pv,
            seatsFirstRound: 0,
            seatsSecondRound: 0,
            totalSeats: 0,
            bonusSeat: false,
            qualifies: pv.votes >= thresholdVotes
        }));

        // First round: Calculate initial seats
        partyResults.forEach(pr => {
            pr.seatsFirstRound = Math.floor((pr.votes / validVotes) * totalSeats);
        });

        // Second round: Distribute remaining seats
        const remainingSeats = totalSeats - partyResults.reduce((sum, pr) => sum + pr.seatsFirstRound, 0);

        if (remainingSeats > 0) {
            // Sort by largest remainder
            partyResults.sort((a, b) => {
                const remainderA = (a.votes / validVotes) * totalSeats - a.seatsFirstRound;
                const remainderB = (b.votes / validVotes) * totalSeats - b.seatsFirstRound;
                return remainderB - remainderA;
            });

            // Distribute remaining seats
            for (let i = 0; i < remainingSeats; i++) {
                partyResults[i].seatsSecondRound = 1;
            }
        }

        // Calculate total seats and bonus seat
        partyResults.forEach(pr => {
            pr.totalSeats = (pr.seatsFirstRound || 0) + (pr.seatsSecondRound || 0);
            pr.bonusSeat = false;
        });

        // Award bonus seat to the party with the most votes
        const winningParty = partyResults.reduce((max, pr) =>
            pr.votes > max.votes ? pr : max
        );
        winningParty.bonusSeat = true;
        winningParty.totalSeats += 1;

        // Get district name
        const province = provinces.find(p => p.id === selectedProvince);
        const district = province?.districts.find(d => d.id === selectedDistrict);

        setCalculationResults({
            partyResults,
            totalSeats,
            validVotes,
            invalidVotes: totalInvalidVotes,
            thresholdVotes,
            votesPerSeat,
            districtName: district?.name || ''
        });

        // Save calculation results to the store
        setCalculatedDistrictResult({
            partyResults,
            totalSeats,
            validVotes,
            invalidVotes: totalInvalidVotes,
            thresholdVotes,
            votesPerSeat,
            districtName: district?.name || ''
        });
    };

    // Handle calculate button click
    const handleCalculateClick = () => {
        calculateSeats();
        setShowResultsModal(true);
    };

    // Get district list for selected province
    const districtList = React.useMemo(() => {
        if (!selectedProvince) return [];
        const province = provinces.find(p => p.id === selectedProvince);
        return province ? province.districts : [];
    }, [selectedProvince, provinces]);

    // Get available parties (not already selected)
    const availableParties = React.useMemo(() => {
        return parties.filter(party => !partyVotes.some(pv => pv.partyId === party.id));
    }, [parties, partyVotes]);

    // Calculate total votes used and remaining votes
    useEffect(() => {
        const used = partyVotes.reduce((sum, pv) => sum + pv.votes, 0);
        setTotalVotesUsed(used);
        setRemainingVotes(totalValidVotes - used);
    }, [partyVotes, totalValidVotes]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Seat Calculation</h2>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Election Year
                        </label>
                        <input
                            type="number"
                            value={electionYear}
                            onChange={handleYearChange}
                            className="form-input w-full"
                            min="1900"
                            max={new Date().getFullYear()}
                            placeholder="Enter election year"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Enter any year between 1900 and {new Date().getFullYear()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Province
                        </label>
                        <select
                            value={selectedProvince}
                            onChange={handleProvinceChange}
                            className="form-select w-full focus:bg-[#F5EEDD]"
                        >
                            <option value="">Select Province</option>
                            {provinces.map(province => (
                                <option key={province.id} value={province.id}>
                                    {province.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            District
                        </label>
                        <select
                            value={selectedDistrict}
                            onChange={handleDistrictChange}
                            className="form-select w-full focus:bg-[#F5EEDD]"
                            disabled={!selectedProvince}
                        >
                            <option value="">Select District</option>
                            {districtList.map(district => (
                                <option key={district.id} value={district.id}>
                                    {district.name} ({district.seatAllocation} seats)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedDistrict && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Valid Votes
                                </label>
                                <input
                                    type="number"
                                    value={totalValidVotes}
                                    onChange={(e) => setTotalValidVotes(Number(e.target.value))}
                                    className="form-input w-full"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Votes
                                </label>
                                <input
                                    type="number"
                                    value={totalInvalidVotes}
                                    onChange={(e) => setTotalInvalidVotes(Number(e.target.value))}
                                    className="form-input w-full"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    District Seats
                                </label>
                                <input
                                    type="number"
                                    value={districtSeats}
                                    onChange={(e) => setDistrictSeats(Number(e.target.value))}
                                    className="form-input w-full"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Number of Parties
                                    </label>
                                    <input
                                        type="number"
                                        value={totalPartyCount}
                                        onChange={(e) => setTotalPartyCount(Number(e.target.value))}
                                        className="form-input w-full"
                                        min="1"
                                        disabled={partyVotes.length > 0}
                                    />
                                    {partyVotes.length > 0 && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            Cannot change party count after adding parties
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-end">
                                    <div className="text-sm text-gray-600">
                                        Parties added: {partyVotes.length} / {totalPartyCount}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-4">Add Party Votes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Party
                                    </label>
                                    <select
                                        ref={partySelectRef}
                                        value={selectedParty}
                                        onChange={(e) => setSelectedParty(e.target.value)}
                                        className="form-select w-full"
                                        disabled={partyVotes.length >= totalPartyCount}
                                    >
                                        <option value="">Select Party</option>
                                        {availableParties.map(party => (
                                            <option key={party.id} value={party.id}>
                                                {party.shortName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Votes
                                    </label>
                                    <input
                                        type="number"
                                        value={partyVoteCount}
                                        onChange={(e) => setPartyVoteCount(Number(e.target.value))}
                                        className="form-input w-full"
                                        min="0"
                                        disabled={partyVotes.length >= totalPartyCount}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && selectedParty && partyVoteCount > 0) {
                                                addPartyVote();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={addPartyVote}
                                        disabled={!selectedParty || partyVoteCount <= 0 || partyVotes.length >= totalPartyCount}
                                        className={`flex items-center px-4 py-2 rounded-md shadow-sm transition-all ${!selectedParty || partyVoteCount <= 0 || partyVotes.length >= totalPartyCount
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-[#2C2C2C] text-white hover:bg-[#2C2C2C]/90'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Party
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Add Progress Bar Section */}
                        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">Valid Vote Distribution</h3>
                                <div className="text-sm text-gray-600">
                                    Remaining Valid Votes: {remainingVotes.toLocaleString()}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                <div 
                                    className="bg-gradient-to-r from-[#AA60C8] to-[#C68EFD] h-4 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(totalVotesUsed / totalValidVotes) * 100}%`,
                                        maxWidth: '100%'
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Used Valid Votes: {totalVotesUsed.toLocaleString()}</span>
                                <span>Total Valid Votes: {totalValidVotes.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Party Vote Distribution */}
                        {partyVotes.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Party Valid Vote Distribution</h3>
                                <div className="space-y-2">
                                    {partyVotes.map(pv => {
                                        const party = parties.find(p => p.id === pv.partyId);
                                        const percentage = (pv.votes / totalValidVotes) * 100;
                                        return (
                                            <div key={pv.partyId} className="bg-gray-50 p-3 rounded-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-4 h-4 rounded-full mr-2"
                                                            style={{ backgroundColor: party?.color }}
                                                        ></div>
                                                        <span className="font-medium">{party?.shortName}</span>
                                                    </div>
                                                    {editingPartyId === pv.partyId ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="number"
                                                                value={editingVotes}
                                                                onChange={(e) => setEditingVotes(parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                className="form-input w-24 text-sm"
                                                            />
                                                            <button
                                                                onClick={() => updatePartyVotes(editingPartyId, editingVotes)}
                                                                className="text-green-600 hover:text-green-800"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingPartyId(null)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="text-sm text-gray-600">
                                                                {pv.votes.toLocaleString()} valid votes ({percentage.toFixed(1)}%)
                                                            </div>
                                                            <button
                                                                onClick={() => startEditingVotes(pv.partyId, pv.votes)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removePartyVote(pv.partyId)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{ 
                                                            width: `${percentage}%`,
                                                            backgroundColor: party?.color
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mb-6">
                            <button
                                onClick={handleCalculateClick}
                                className="px-6 py-3 bg-gradient-to-r from-[#AA60C8] to-[#C68EFD] text-white rounded-md hover:from-[#AA60C8]/90 hover:to-[#C68EFD]/90 transition-colors"
                                disabled={editingPartyId !== null}
                            >
                                <Calculator className="w-4 h-4 mr-2" />
                                Calculate Seats
                            </button>
                        </div>
                    </>
                )}

                {/* Results Modal */}
                {showResultsModal && calculationResults && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold">Calculation Results</h3>
                                    <button
                                        onClick={() => setShowResultsModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-600">District</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.districtName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Votes</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.validVotes.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Valid Votes</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.invalidVotes.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Seats</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.totalSeats}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">5% Threshold</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.thresholdVotes.toLocaleString()} votes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Votes per Seat</p>
                                        <p className="text-2xl font-bold">
                                            {calculationResults.votesPerSeat.toLocaleString()} votes
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto mb-6">
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
                                            {calculationResults.partyResults.map((result: any) => {
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

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowResultsModal(false)}
                                        className="px-6 py-3 bg-[#2C2C2C] text-white rounded-md hover:bg-[#2C2C2C]/90 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {calculationResults && !showResultsModal && (
                    <div className="bg-[#f0f7ff] rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Calculation Results</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">District</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.districtName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Votes</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.validVotes.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Valid Votes</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.invalidVotes.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">Total Seats</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.totalSeats}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">5% Threshold</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.thresholdVotes.toLocaleString()} votes
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Votes per Seat</p>
                                <p className="text-2xl font-bold">
                                    {calculationResults.votesPerSeat.toLocaleString()} votes
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
                                    {calculationResults.partyResults.map((result: any) => {
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

                {!selectedDistrict && (
                    <div className="text-center py-12 text-gray-500">
                        <ArrowRight className="w-8 h-8 mx-auto mb-4" />
                        <p className="text-lg">
                            Please select a province and district to calculate seats
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeatCalculation; 