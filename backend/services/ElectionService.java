package backend.services;

import backend.db.DatabaseConnector;
import backend.models.KeyValue;
import backend.models.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ElectionService {

    public User authenticate(String username, String password) {
        String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            stmt.setString(2, password);
            
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return new User(
                    rs.getString("username"),
                    rs.getString("password"),
                    rs.getString("role")
                );
            }
        } catch (SQLException e) {
            System.err.println("Authentication error: " + e.getMessage());
        }
        return null;
    }

    public boolean isResultExists(String district, int year) {
        String sql = """
            SELECT 1
            FROM district_election de
            JOIN district d ON de.district_id = d.district_id
            JOIN election e ON de.election_id = e.election_id
            WHERE LOWER(d.district_name) = LOWER(?) AND e.year = ?
            LIMIT 1
        """;
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, district);
            ps.setInt(2, year);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            System.err.println("❌ Error checking existing result: " + e.getMessage());
            return false;
        }
    }

    public void saveResults(
            String district, int seatCount, int year,
            KeyValue[] politicalParty, int[] finalSeats, int[] validVotesPerParty,
            // int totalVotes,int rectedVotes,
            int totalValidVotes, int disqualifyPartyCount, int disqualifyVotes, int threshold5Percent,
            int[] bonusRoundSeats, int[] firstRoundSeats, int[] secondRoundSeats
            
    ) {
        if (politicalParty == null || finalSeats == null || validVotesPerParty == null ||
                politicalParty.length != finalSeats.length ||
                politicalParty.length != validVotesPerParty.length) {
            throw new IllegalArgumentException("Invalid input arrays");
        }

        try (Connection conn = DatabaseConnector.getConnection()) {
            conn.setAutoCommit(false);

            // 1. Get or insert election
            int electionId = -1;
            String selectElection = "SELECT election_id FROM election WHERE year = ?";
            try (PreparedStatement ps = conn.prepareStatement(selectElection)) {
                ps.setInt(1, year);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        electionId = rs.getInt("election_id");
                    }
                }
            }
            if (electionId == -1) {
                String insertElection = "INSERT INTO election (year) VALUES (?)";
                try (PreparedStatement ps = conn.prepareStatement(insertElection, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, year);
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            electionId = rs.getInt(1);
                        }
                    }
                }
            }

            // 2. Get district_id
            int districtId = -1;
            String selectDistrict = "SELECT district_id FROM district WHERE LOWER(district_name) = LOWER(?)";
            try (PreparedStatement ps = conn.prepareStatement(selectDistrict)) {
                ps.setString(1, district);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        districtId = rs.getInt("district_id");
                    } else {
                        throw new SQLException("District not found: " + district);
                    }
                }
            }

            // 3. Insert into district_election
            int districtElectionId = -1;
            String insertDistrictElection = """
                INSERT INTO district_election (
                    total_valid_votes_for_seat, disqualify_votes, disqualify_party_count, threshold_5_percent,
                    district_id, election_id
                ) VALUES (?, ?, ?, ?, ?, ?)
            """;
            try (PreparedStatement ps = conn.prepareStatement(insertDistrictElection, PreparedStatement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, totalValidVotes);
                ps.setInt(2, disqualifyVotes);
                ps.setInt(3, disqualifyPartyCount);
                ps.setInt(4, threshold5Percent);
                ps.setInt(5, districtId);
                ps.setInt(6, electionId);
                ps.executeUpdate();
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        districtElectionId = rs.getInt(1);
                    }
                }
            }

            // 4. Insert parties if not exist, and get their IDs
            int[] partyIds = new int[politicalParty.length];
            for (int i = 0; i < politicalParty.length; i++) {
                String selectParty = "SELECT party_id FROM party WHERE party_name = ?";
                try (PreparedStatement ps = conn.prepareStatement(selectParty)) {
                    ps.setString(1, politicalParty[i].key);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            partyIds[i] = rs.getInt("party_id");
                        } else {
                            String insertParty = "INSERT INTO party (party_name) VALUES (?)";
                            try (PreparedStatement psInsert = conn.prepareStatement(insertParty, PreparedStatement.RETURN_GENERATED_KEYS)) {
                                psInsert.setString(1, politicalParty[i].key);
                                psInsert.executeUpdate();
                                try (ResultSet rsInsert = psInsert.getGeneratedKeys()) {
                                    if (rsInsert.next()) {
                                        partyIds[i] = rsInsert.getInt(1);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 5. Insert party_votes
            String insertPartyVotes = """
                INSERT INTO party_votes (votes, district_election_id, party_id)
                VALUES (?, ?, ?)
            """;
            try (PreparedStatement ps = conn.prepareStatement(insertPartyVotes)) {
                for (int i = 0; i < politicalParty.length; i++) {
                    ps.setInt(1, validVotesPerParty[i]);
                    ps.setInt(2, districtElectionId);
                    ps.setInt(3, partyIds[i]);
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            // 6. Insert seat_allocation
            String insertSeatAllocation = """
                INSERT INTO seat_allocation (
                    bonus_round, first_round, second_round, final_allocation,
                    district_election_id, party_id
                ) VALUES (?, ?, ?, ?, ?, ?)
            """;
            try (PreparedStatement ps = conn.prepareStatement(insertSeatAllocation)) {
                for (int i = 0; i < politicalParty.length; i++) {
                    ps.setInt(1, bonusRoundSeats[i]); // bonus_round (set as needed)
                    ps.setInt(2, firstRoundSeats[i]); // first_round (set as needed)
                    ps.setInt(3, secondRoundSeats[i]); // second_round (set as needed)
                    ps.setInt(4, finalSeats[i]);
                    ps.setInt(5, districtElectionId);
                    ps.setInt(6, partyIds[i]);
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            conn.commit();
            System.out.println("✅ Election results saved successfully.");
        } catch (SQLException e) {
            System.err.println("❌ Error saving election results: " + e.getMessage());
        }
    }
}