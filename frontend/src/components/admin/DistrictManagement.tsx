import React, { useState } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Plus, Edit, Trash2, X, Check, Save } from 'lucide-react';

interface DistrictInput {
  id: string;
  name: string;
  seatAllocation: number;
}

interface ProvinceInput {
  provinceId: string;
  districtCount: number;
  districts: DistrictInput[];
}

const DistrictManagement: React.FC = () => {
  const {
    provinces,
    addDistrict,
    updateDistrict,
    deleteDistrict
  } = useElectionStore();

  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [totalDistricts, setTotalDistricts] = useState(0);
  const [provinceInputs, setProvinceInputs] = useState<ProvinceInput[]>([]);
  const [currentProvinceIndex, setCurrentProvinceIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [editingInfo, setEditingInfo] = useState<{
    provinceId: string;
    districtId: string;
    name: string;
    seatAllocation: number;
  } | null>(null);

  // Calculate total districts added
  const getTotalDistrictsAdded = () => {
    return provinceInputs.reduce((total, input) => total + input.districts.length, 0);
  };

  // Calculate remaining districts
  const getRemainingDistricts = () => {
    return totalDistricts - getTotalDistrictsAdded();
  };

  // Handle total districts change
  const handleTotalDistrictsChange = (count: number) => {
    if (count < 0) return;
    setTotalDistricts(count);
    setProvinceInputs([]);
    setCurrentProvinceIndex(0);
    setErrorMessage('');
  };

  // Handle province selection
  const handleProvinceChange = (provinceId: string) => {
    const newProvinceInputs = [...provinceInputs];
    newProvinceInputs[currentProvinceIndex] = {
      ...newProvinceInputs[currentProvinceIndex],
      provinceId,
      districtCount: 0,
      districts: []
    };
    setProvinceInputs(newProvinceInputs);
    setErrorMessage('');
  };

  // Handle district count change
  const handleDistrictCountChange = (count: number) => {
    if (count < 0 || count > getRemainingDistricts()) return;
    
    const newProvinceInputs = [...provinceInputs];
    newProvinceInputs[currentProvinceIndex] = {
      ...newProvinceInputs[currentProvinceIndex],
      districtCount: count,
      districts: Array(count).fill(null).map(() => ({
        id: '',
        name: '',
        seatAllocation: 0
      }))
    };
    setProvinceInputs(newProvinceInputs);
    setErrorMessage('');
  };

  // Handle district input change
  const handleDistrictInputChange = (index: number, field: string, value: string | number) => {
    const newProvinceInputs = [...provinceInputs];
    const currentProvince = newProvinceInputs[currentProvinceIndex];

    if (field === 'name') {
      // Only allow letters and spaces
      value = String(value).replace(/[^a-zA-Z\s]/g, '');
      
      // Check for duplicate names in current province
      const isDuplicate = currentProvince.districts.some((input, i) => 
        i !== index && input.name.toLowerCase() === String(value).toLowerCase()
      );
      
      if (isDuplicate) {
        setErrorMessage('District name already exists. Please use a different name.');
        return;
      }

      // Check for duplicate names in other provinces
      const isExistingDuplicate = provinceInputs.some((province, pIndex) => 
        pIndex !== currentProvinceIndex && 
        province.districts.some(district => 
          district.name.toLowerCase() === String(value).toLowerCase()
        )
      );

      if (isExistingDuplicate) {
        setErrorMessage('District name already exists in another province. Please use a different name.');
        return;
      }
    }

    currentProvince.districts[index] = {
      ...currentProvince.districts[index],
      [field]: field === 'seatAllocation' ? Number(value) || 0 : value,
      id: field === 'name' ? String(value).toLowerCase().replace(/\s+/g, '') : currentProvince.districts[index].id
    };
    setProvinceInputs(newProvinceInputs);
    setErrorMessage('');
  };

  // Check if current province's districts are filled
  const isCurrentProvinceFilled = () => {
    const currentProvince = provinceInputs[currentProvinceIndex];
    if (!currentProvince) return false;
    return currentProvince.districts.every(
      input => input.name.trim() !== '' && input.seatAllocation > 0
    );
  };

  // Handle next province
  const handleNextProvince = () => {
    if (!isCurrentProvinceFilled()) {
      setErrorMessage('Please fill in all district names and seat allocations');
      return;
    }

    if (getRemainingDistricts() > 0) {
      setCurrentProvinceIndex(prev => prev + 1);
      setProvinceInputs(prev => [...prev, {
        provinceId: '',
        districtCount: 0,
        districts: []
      }]);
    } else {
      setShowConfirmation(true);
    }
  };

  // Handle create districts
  const handleCreateDistricts = () => {
    provinceInputs.forEach(province => {
      province.districts.forEach(district => {
        if (district.name.trim() !== '') {
          addDistrict(province.provinceId, {
            id: district.id,
            name: district.name,
            seatAllocation: district.seatAllocation
          });
        }
      });
    });

    // Reset state
    setShowModal(false);
    setShowConfirmation(false);
    setTotalDistricts(0);
    setProvinceInputs([]);
    setCurrentProvinceIndex(0);
    setErrorMessage('');
  };

  // Start editing a district
  const handleStartEdit = (
    provinceId: string,
    district: { id: string; name: string; seatAllocation: number }
  ) => {
    setEditingInfo({
      provinceId,
      districtId: district.id,
      name: district.name,
      seatAllocation: district.seatAllocation
    });
  };

  // Handle input change for editing
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!editingInfo) return;

    const { name, value } = e.target;
    setEditingInfo(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === 'seatAllocation' ? parseInt(value) || 0 : value
      };
    });
  };

  // Save district edit
  const handleSaveEdit = () => {
    if (
      !editingInfo ||
      editingInfo.name.trim() === '' ||
      editingInfo.seatAllocation <= 0
    ) {
      return;
    }

    updateDistrict(
      editingInfo.provinceId,
      editingInfo.districtId,
      {
        name: editingInfo.name,
        seatAllocation: editingInfo.seatAllocation
      }
    );

    setEditingInfo(null);
  };

  // Cancel district edit
  const handleCancelEdit = () => {
    setEditingInfo(null);
  };

  // Delete district confirmation
  const handleDeleteDistrict = (provinceId: string, districtId: string) => {
    if (window.confirm('Are you sure you want to delete this district? This will also delete all associated results.')) {
      deleteDistrict(provinceId, districtId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">District Management</h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#3D3D3D] text-white hover:bg-[#3D3D3D]/90 flex items-center px-4 py-2 rounded-md shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Districts
        </button>
      </div>

      {/* Modal for adding multiple districts */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Add Districts</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTotalDistricts(0);
                  setProvinceInputs([]);
                  setCurrentProvinceIndex(0);
                  setErrorMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Total Districts Input */}
              {currentProvinceIndex === 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Number of Districts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalDistricts}
                    onChange={(e) => handleTotalDistrictsChange(parseInt(e.target.value) || 0)}
                    className="form-input w-full"
                    placeholder="Enter total number of districts"
                  />
                </div>
              )}

              {/* Progress Bar */}
              {totalDistricts > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{getTotalDistrictsAdded()} of {totalDistricts} Districts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(getTotalDistrictsAdded() / totalDistricts) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Remaining districts: {getRemainingDistricts()}
                  </p>
                </div>
              )}

              {/* Province Selection */}
              {totalDistricts > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Province
                  </label>
                  <select
                    value={provinceInputs[currentProvinceIndex]?.provinceId || ''}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="form-select w-full focus:bg-[#F5EEDD]"
                  >
                    <option value="">Select Province</option>
                    {provinces
                      .filter(province => 
                        !provinceInputs.some(input => input.provinceId === province.id)
                      )
                      .map(province => (
                        <option key={province.id} value={province.id}>
                          {province.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* District Count Input */}
              {provinceInputs[currentProvinceIndex]?.provinceId && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Districts to Add
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={getRemainingDistricts()}
                    value={provinceInputs[currentProvinceIndex]?.districtCount || 0}
                    onChange={(e) => handleDistrictCountChange(parseInt(e.target.value) || 0)}
                    className="form-input w-full"
                    placeholder="Enter number of districts"
                  />
                </div>
              )}

              {/* District Inputs */}
              {provinceInputs[currentProvinceIndex]?.districtCount > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Enter District Details
                  </h4>
                  {provinceInputs[currentProvinceIndex].districts.map((input, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District {index + 1} Name
                        </label>
                        <input
                          type="text"
                          value={input.name}
                          onChange={(e) => handleDistrictInputChange(index, 'name', e.target.value)}
                          placeholder={`District ${index + 1} Name`}
                          className="form-input w-full"
                          pattern="[A-Za-z\s]*"
                          title="Only letters and spaces are allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seat Allocation
                        </label>
                        <input
                          type="number"
                          value={input.seatAllocation || ''}
                          onChange={(e) => handleDistrictInputChange(index, 'seatAllocation', e.target.value)}
                          placeholder="Number of Seats"
                          min="1"
                          className="form-input w-full"
                        />
                      </div>
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
                  setTotalDistricts(0);
                  setProvinceInputs([]);
                  setCurrentProvinceIndex(0);
                  setErrorMessage('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleNextProvince}
                disabled={!isCurrentProvinceFilled()}
                className={`px-6 py-2 rounded-md shadow-sm transition-all ${
                  isCurrentProvinceFilled()
                    ? 'bg-[#3D3D3D] text-white hover:bg-[#3D3D3D]/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {getRemainingDistricts() === 0 ? 'Finish' : 'Next Province'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm District Creation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to create {totalDistricts} districts across {provinceInputs.length} provinces?
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleCreateDistricts}
                className="px-6 py-2 bg-[#3D3D3D] text-white rounded-md hover:bg-[#3D3D3D]/90 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {provinces.map(province => (
          <div key={province.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                {province.name}
              </h3>
            </div>

            {province.districts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No districts found in this province.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        District Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Allocation
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {province.districts.map(district => (
                      <tr key={district.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingInfo &&
                            editingInfo.provinceId === province.id &&
                            editingInfo.districtId === district.id ? (
                            <input
                              type="text"
                              name="name"
                              value={editingInfo.name}
                              onChange={handleEditChange}
                              className="form-input"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {district.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingInfo &&
                            editingInfo.provinceId === province.id &&
                            editingInfo.districtId === district.id ? (
                            <input
                              type="number"
                              name="seatAllocation"
                              value={editingInfo.seatAllocation || ''}
                              onChange={handleEditChange}
                              min="1"
                              className="form-input w-24"
                            />
                          ) : (
                            <div className="text-sm text-gray-900">
                              {district.seatAllocation} seats
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingInfo &&
                            editingInfo.provinceId === province.id &&
                            editingInfo.districtId === district.id ? (
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
                                onClick={() => handleStartEdit(province.id, district)}
                                className="text-[#005ad4] hover:bg-[#92b7e8]/20 rounded-full transition-colors"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDistrict(province.id, district.id)}
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
        ))}
      </div>
    </div>
  );
};

export default DistrictManagement;