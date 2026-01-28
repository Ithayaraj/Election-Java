import React, { useEffect, useState } from 'react';
import {
  getAllProvinces
} from '../../api/ProvinceService'; // adjust the path if needed

// Define Province type for documentation and type hinting
/**
 * @typedef {Object} Province
 * @property {number} province_id
 * @property {string} province_name
 */

const ProvinceList = () => {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllProvinces()
      .then(response => {
        setProvinces(response.data);
        setLoading(false);
        console.log("✅ Provinces loaded:", response.data); // Debug
      })
      .catch(err => {
        console.error("❌ Failed to fetch provinces:", err);
        setError("Failed to load provinces");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading provinces...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Provinces</h2>
      <ul className="list-disc pl-6">
        {provinces.map(province => (
          <li key={province.province_id}>
            {province.province_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProvinceList;
