import React, { useState } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Plus, Edit, Trash2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProvinceInput {
  id: string;
  name: string;
}

const ProvinceManagement: React.FC = () => {
  const {
    provinces,
    addProvince,
    updateProvince,
    deleteProvince
  } = useElectionStore();

  const [showModal, setShowModal] = useState(false);
  const [provinceCount, setProvinceCount] = useState(0);
  const [provinceInputs, setProvinceInputs] = useState<ProvinceInput[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [editingInfo, setEditingInfo] = useState<{
    provinceId: string;
    name: string;
  } | null>(null);

  // Calculate pagination
  const totalPages = Math.ceil(provinces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProvinces = provinces.slice(startIndex, endIndex);

  // Pagination controls
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Handle province count change
  const handleProvinceCountChange = (count: number) => {
    if (count < 0) return;
    setProvinceCount(count);
    setErrorMessage('');
    const newInputs = Array(count).fill(null).map(() => ({
      id: '',
      name: ''
    }));
    setProvinceInputs(newInputs);
  };

  // Handle province input change
  const handleProvinceInputChange = (index: number, value: string) => {
    // Only allow letters and spaces
    value = value.replace(/[^a-zA-Z\s]/g, '');
    
    const newInputs = [...provinceInputs];
    
    // Check for duplicate names
    const isDuplicate = newInputs.some((input, i) => 
      i !== index && input.name.toLowerCase() === value.toLowerCase()
    );
    
    if (isDuplicate) {
      setErrorMessage('Province name already exists. Please use a different name.');
      return;
    }

    // Check for duplicate names in existing provinces
    const isExistingDuplicate = provinces.some(
      province => province.name.toLowerCase() === value.toLowerCase()
    );

    if (isExistingDuplicate) {
      setErrorMessage('Province name already exists. Please use a different name.');
      return;
    }

    newInputs[index] = {
      id: value.toLowerCase().replace(/\s+/g, ''),
      name: value
    };
    setProvinceInputs(newInputs);
    setErrorMessage('');
  };

  // Check if all provinces are properly filled
  const areAllProvincesFilled = () => {
    return provinceInputs.every(input => input.name.trim() !== '');
  };

  // Handle create provinces
  const handleCreateProvinces = () => {
    if (!areAllProvincesFilled()) {
      setErrorMessage('Please fill in all province names');
      return;
    }

    provinceInputs.forEach(input => {
      if (input.name.trim() !== '') {
        addProvince({
          id: input.id,
          name: input.name,
          districts: []
        });
      }
    });

    // Close modal and reset state
    setShowModal(false);
    setProvinceCount(0);
    setProvinceInputs([]);
    setErrorMessage('');
  };

  // Start editing a province
  const handleStartEdit = (
    province: { id: string; name: string }
  ) => {
    setEditingInfo({
      provinceId: province.id,
      name: province.name
    });
  };

  // Handle input change for editing
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editingInfo) return;

    const { value } = e.target;
    // Only allow letters and spaces
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    
    setEditingInfo(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        name: sanitizedValue
      };
    });
  };

  // Save province edit
  const handleSaveEdit = () => {
    if (!editingInfo || editingInfo.name.trim() === '') {
      return;
    }

    // Check for duplicate names
    const isDuplicate = provinces.some(
      province => 
        province.id !== editingInfo.provinceId && 
        province.name.toLowerCase() === editingInfo.name.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage('Province name already exists. Please use a different name.');
      return;
    }

    updateProvince(editingInfo.provinceId, {
      name: editingInfo.name
    });

    setEditingInfo(null);
    setErrorMessage('');
  };

  // Cancel province edit
  const handleCancelEdit = () => {
    setEditingInfo(null);
    setErrorMessage('');
  };

  // Delete province confirmation
  const handleDeleteProvince = (provinceId: string) => {
    if (window.confirm('Are you sure you want to delete this province? This will also delete all associated districts and results.')) {
      deleteProvince(provinceId);
    }
  };

  return (
    <div className="h-full">
      <div className="p-8 bg-white">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Province Management</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#3D3D3D] text-white hover:bg-[#3D3D3D]/90 flex items-center px-6 py-3 rounded-md shadow-sm transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Provinces
          </button>
        </div>

        {/* Province List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Province Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Districts
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProvinces.map(province => (
                  <tr key={province.id} className="hover:bg-gray-50">
                    <td className="px-8 py-5 whitespace-nowrap">
                      {editingInfo?.provinceId === province.id ? (
                        <input
                          type="text"
                          value={editingInfo.name}
                          onChange={handleEditChange}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-[#074799] focus:border-[#074799] block w-full sm:text-sm"
                        />
                      ) : (
                        <div className="text-base font-medium text-gray-900">
                          {province.name}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-500">
                        {province.districts.length} districts
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      {editingInfo?.provinceId === province.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(province)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProvince(province.id)}
                            className="text-red-600 hover:text-red-900"
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

          {/* Pagination Controls */}
          <div className="px-8 py-6 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-5 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-base text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(endIndex, provinces.length)}
                  </span>{' '}
                  of <span className="font-medium">{provinces.length}</span> provinces
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for adding multiple provinces */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Add Provinces</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProvinceCount(0);
                  setProvinceInputs([]);
                  setErrorMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Province Count Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Provinces to Add
                </label>
                <input
                  type="number"
                  min="0"
                  value={provinceCount}
                  onChange={(e) => handleProvinceCountChange(parseInt(e.target.value) || 0)}
                  className="form-input w-full"
                  placeholder="Enter number of provinces"
                />
              </div>

              {/* Province Inputs */}
              {provinceCount > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Enter Province Names
                  </h4>
                  {provinceInputs.map((input, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province {index + 1} Name
                      </label>
                      <input
                        type="text"
                        value={input.name}
                        onChange={(e) => handleProvinceInputChange(index, e.target.value)}
                        placeholder={`Province ${index + 1} Name`}
                        className="form-input w-full"
                        pattern="[A-Za-z\s]*"
                        title="Only letters and spaces are allowed"
                      />
                    </div>
                  ))}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 p-6 border-t">
              <button
                onClick={() => {
                  setShowModal(false);
                  setProvinceCount(0);
                  setProvinceInputs([]);
                  setErrorMessage('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleCreateProvinces}
                disabled={!areAllProvincesFilled()}
                className={`px-6 py-2 rounded-md shadow-sm transition-all ${
                  areAllProvincesFilled()
                    ? 'bg-[#3D3D3D] text-white hover:bg-[#3D3D3D]/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Provinces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvinceManagement;