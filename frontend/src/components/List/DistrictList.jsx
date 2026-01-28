import React, { useEffect, useState } from 'react';
import {
  getAllDistrictElections,
  createDistrictElection,
  updateDistrictElection,
  deleteDistrictElection
} from '../../api/DistrictElectionService';

/**
 * @typedef {Object} Election
 * @property {number} id
 * @property {string} districtName
 * @property {number} totalVotes
 * // add other fields if needed
 */

const DistrictElectionList = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDistrictElections()
      .then((response) => {
        setElections(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("API Error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading elections...</p>;

  return (
    <div>
      <h2>District Elections</h2>
      <ul>
        {elections.map(e => (
          <li key={e.id}>{e.districtName} - {e.totalVotes} votes</li>
        ))}
      </ul>
    </div>
  );
};

export default DistrictElectionList;