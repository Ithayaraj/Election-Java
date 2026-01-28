import React, { useState } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Plus, Edit, Trash2, X, Check, Save, Image } from 'lucide-react';

interface PartyInput {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
}

const PartyManagement: React.FC = () => {
  const { parties, addParty, updateParty, deleteParty } = useElectionStore();

  const [showModal, setShowModal] = useState(false);
  const [partyCount, setPartyCount] = useState(0);
  const [partyInputs, setPartyInputs] = useState<PartyInput[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [editingParty, setEditingParty] = useState<{
    id: string;
    name: string;
    shortName: string;
    color: string;
    logo?: string;
  } | null>(null);

  // Handle party count change
  const handlePartyCountChange = (count: number) => {
    if (count < 0) return;
    setPartyCount(count);
    setErrorMessage('');
    const newInputs = Array(count).fill(null).map((_, index) => ({
      id: '',
      name: '',
      shortName: '',
      color: '#3B82F6',
      logo: ''
    }));
    setPartyInputs(newInputs);
  };

  // Handle party input change
  const handlePartyInputChange = (index: number, field: string, value: string) => {
    const newInputs = [...partyInputs];
    newInputs[index] = {
      ...newInputs[index],
      [field]: value,
      id: field === 'name' ? String(value).toLowerCase().replace(/\s+/g, '') : newInputs[index].id
    };
    setPartyInputs(newInputs);
  };

  // Handle logo selection
  const handleLogoSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handlePartyInputChange(index, 'logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logo selection for editing
  const handleEditLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingParty) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingParty({
          ...editingParty,
          logo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create parties
  const handleCreateParties = () => {
    if (partyCount === 0) {
      setErrorMessage('Please enter the number of parties to create');
      return;
    }

    const hasEmptyFields = partyInputs.some(
      input => input.name.trim() === '' || input.shortName.trim() === '' || input.color.trim() === ''
    );
    if (hasEmptyFields) {
      setErrorMessage('Please fill in all party details');
      return;
    }

    partyInputs.forEach(input => {
      if (input.name.trim() !== '') {
        addParty({
          id: input.id,
          name: input.name,
          shortName: input.shortName,
          color: input.color,
          logo: input.logo
        });
      }
    });

    setShowModal(false);
    setPartyCount(0);
    setPartyInputs([]);
    setErrorMessage('');
  };

  // Start editing a party
  const handleStartEdit = (party: {
    id: string;
    name: string;
    shortName: string;
    color: string;
    logo?: string;
  }) => {
    setEditingParty({
      id: party.id,
      name: party.name,
      shortName: party.shortName,
      color: party.color,
      logo: party.logo
    });
  };

  // Handle input change for editing
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editingParty) return;

    const { name, value } = e.target;
    setEditingParty(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Save party edit
  const handleSaveEdit = () => {
    if (
      !editingParty ||
      editingParty.name.trim() === '' ||
      editingParty.shortName.trim() === '' ||
      editingParty.color.trim() === ''
    ) {
      return;
    }

    updateParty(
      editingParty.id,
      {
        name: editingParty.name,
        shortName: editingParty.shortName,
        color: editingParty.color,
        logo: editingParty.logo
      }
    );

    setEditingParty(null);
  };

  // Cancel party edit
  const handleCancelEdit = () => {
    setEditingParty(null);
  };

  // Delete party confirmation
  const handleDeleteParty = (id: string) => {
    if (window.confirm('Are you sure you want to delete this party? This will also delete all associated results.')) {
      deleteParty(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Party Management</h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#4A4947] text-white hover:bg-[#4A4947]/90 flex items-center px-4 py-2 rounded-md shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Parties
        </button>
      </div>

      {/* Modal for adding multiple parties */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Multiple Parties</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPartyCount(0);
                  setPartyInputs([]);
                  setErrorMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-700">Number of Parties:</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePartyCountChange(Math.max(0, partyCount - 1))}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={partyCount}
                    onChange={(e) => handlePartyCountChange(parseInt(e.target.value) || 0)}
                    className="form-input w-16 text-center"
                  />
                  <button
                    onClick={() => handlePartyCountChange(partyCount + 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {partyInputs.map((input, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Party {index + 1} Name
                      </label>
                      <input
                        type="text"
                        value={input.name}
                        onChange={(e) => handlePartyInputChange(index, 'name', e.target.value)}
                        placeholder={`Party ${index + 1} Name`}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={input.shortName}
                        onChange={(e) => handlePartyInputChange(index, 'shortName', e.target.value)}
                        placeholder="Abbreviation"
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Party Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={input.color}
                          onChange={(e) => handlePartyInputChange(index, 'color', e.target.value)}
                          className="form-input w-10 h-10 p-1"
                        />
                        <label className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLogoSelect(index, e)}
                            className="hidden"
                          />
                          <Image className="w-5 h-5 text-gray-500" />
                        </label>
                      </div>
                      {input.logo && (
                        <div className="mt-2">
                          <img src={input.logo} alt="Party logo" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPartyCount(0);
                  setPartyInputs([]);
                  setErrorMessage('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleCreateParties}
                className="bg-[#4A4947] text-white hover:bg-[#4A4947]/90 px-6 py-2 rounded-md shadow-sm transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {parties.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No parties found. Add your first party to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color & Logo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parties.map(party => (
                  <tr key={party.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingParty && editingParty.id === party.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            name="color"
                            value={editingParty.color}
                            onChange={handleEditChange}
                            className="w-10 h-10 rounded-full border border-gray-200"
                          />
                          <label className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditLogoSelect}
                              className="hidden"
                            />
                            <Image className="w-5 h-5 text-gray-500" />
                          </label>
                          {editingParty.logo && (
                            <img src={editingParty.logo} alt="Party logo" className="w-8 h-8 object-contain" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-10 h-10 rounded-full border border-gray-200"
                            style={{ backgroundColor: party.color }}
                          ></div>
                          {party.logo && (
                            <img src={party.logo} alt="Party logo" className="w-8 h-8 object-contain" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingParty && editingParty.id === party.id ? (
                        <input
                          type="text"
                          name="name"
                          value={editingParty.name}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {party.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingParty && editingParty.id === party.id ? (
                        <input
                          type="text"
                          name="shortName"
                          value={editingParty.shortName}
                          onChange={handleEditChange}
                          className="form-input w-24"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {party.shortName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingParty && editingParty.id === party.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-[#bec626] hover:bg-[#f9ff88]/20 rounded-full transition-colors"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleStartEdit(party)}
                            className="text-[#005ad4] hover:bg-[#92b7e8]/20 rounded-full transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteParty(party.id)}
                            className="text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyManagement;