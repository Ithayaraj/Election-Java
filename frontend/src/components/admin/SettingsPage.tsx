import React, { useState } from 'react';
import { useElectionStore } from '../../store/electionStore';
import { Save, PlusCircle, Trash2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { results, currentYear } = useElectionStore();
  
  // Get available years from results
  const availableYears = results.map(r => r.year).sort((a, b) => a - b);
  
  const [newYear, setNewYear] = useState<number>(currentYear + 5);
  const [dataImportSource, setDataImportSource] = useState<string>('');
  
  // Handle new year change
  const handleNewYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewYear(parseInt(e.target.value, 10) || currentYear);
  };
  
  // Handle add new election year
  const handleAddElectionYear = () => {
    // This would create a new year in the store
    alert(`Adding new election year: ${newYear} (Not implemented in this demo)`);
  };
  
  // Handle delete year
  const handleDeleteYear = (year: number) => {
    if (window.confirm(`Are you sure you want to delete all data for the ${year} election? This action cannot be undone.`)) {
      alert(`Deleting year ${year} (Not implemented in this demo)`);
    }
  };
  
  // Handle data import source change
  const handleDataImportSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDataImportSource(e.target.value);
  };
  
  // Handle import data
  const handleImportData = () => {
    if (!dataImportSource) return;
    
    alert(`Importing data from ${dataImportSource} (Not implemented in this demo)`);
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Election Years</h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Current available election years:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableYears.map(year => (
                <div 
                  key={year}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{year}</span>
                  <button
                    onClick={() => handleDeleteYear(year)}
                    className="ml-2 text-blue-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-medium mb-3">Add New Election Year</h4>
            <p className="text-sm text-gray-600 mb-4">
              According to Sri Lankan law, local government elections are held every 5 years.
            </p>
            
            <div className="flex items-end space-x-3">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Election Year
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={handleNewYearChange}
                  min={Math.max(...availableYears) + 1}
                  step="5"
                  className="form-input w-full"
                />
              </div>
              <button
                onClick={handleAddElectionYear}
                className="btn btn-primary flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Year
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Data Import/Export</h3>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3">Import Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Import election data from a previous year or from an external source.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import Source
                </label>
                <select
                  value={dataImportSource}
                  onChange={handleDataImportSourceChange}
                  className="form-select w-full"
                >
                  <option value="">Select Source</option>
                  <option value="previous">Previous Election Year</option>
                  <option value="file">JSON File</option>
                  <option value="api">External API</option>
                </select>
              </div>
              
              <button
                onClick={handleImportData}
                className="btn btn-primary"
                disabled={!dataImportSource}
              >
                Import Data
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-medium mb-3">Export Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export election data for backup or external analysis.
            </p>
            
            <button
              onClick={() => alert('Export functionality not implemented in this demo')}
              className="btn btn-secondary"
            >
              Export to JSON
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">System Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-3">Calculation Parameters</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invalid Vote Percentage
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={5}
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-input w-24"
                    />
                    <span className="ml-2">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of total votes to be considered invalid
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Disqualification Threshold
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={5}
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-input w-24"
                    />
                    <span className="ml-2">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum percentage of valid votes for a party to qualify for seats
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-3">Display Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Election Year
                  </label>
                  <select
                    value={currentYear}
                    className="form-select w-full"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showDisqualified"
                    checked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showDisqualified" className="ml-2 block text-sm text-gray-700">
                    Show disqualified parties in results
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => alert('Settings saved (Not implemented in this demo)')}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;