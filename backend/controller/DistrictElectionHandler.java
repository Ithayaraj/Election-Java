package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class DistrictElectionHandler implements HttpHandler {
   @Override
public void handle(HttpExchange exchange) throws IOException {
    String method = exchange.getRequestMethod();
    String path = exchange.getRequestURI().getPath();
    String[] segments = path.split("/");

    switch (method) {
        
        case "GET":
            // Expecting /district-election or /district-election/{id} or /district-election/all-by-year/{year}
            if (segments.length > 3 && "all-by-year".equals(segments[2]) && segments[3].matches("\\d+")) {
                // /district-election/all-by-year/{year}
                int year = Integer.parseInt(segments[3]);
                get_DistrictElection_AllDistrictByYear(exchange, year);
            } else if (segments.length > 2 && segments[2].matches("\\d+")) {
                try {
                    int id = Integer.parseInt(segments[2]);
                    getDistrictElectionById(exchange, id);
                } catch (NumberFormatException e) {
                    exchange.sendResponseHeaders(400, -1); // Bad Request
                }
            } else {
                getDistrictElections(exchange);
            }
            break;
            
        case "POST":
            createDistrictElection(exchange);
            break;
            
        case "PUT":
            // Expecting /district-election/{id}
            if (segments.length > 2 && segments[2].matches("\\d+")) {
                try {
                    int id = Integer.parseInt(segments[2]);
                    updateDistrictElection(exchange, id);
                } catch (NumberFormatException e) {
                    exchange.sendResponseHeaders(400, -1); // Bad Request
                }
            } else {
                exchange.sendResponseHeaders(400, -1); // Bad Request
            }
            break;

        case "DELETE":
            // Expecting /district-election/{id}
            if (segments.length > 2 && segments[2].matches("\\d+")) {
                try {
                    int id = Integer.parseInt(segments[2]);
                    deleteDistrictElection(exchange, id);
                } catch (NumberFormatException e) {
                    exchange.sendResponseHeaders(400, -1); // Bad Request
                }
            } else {
                exchange.sendResponseHeaders(400, -1); // Bad Request
            }
            break;
        
            
        default:
            exchange.sendResponseHeaders(405, -1); // Method Not Allowed
            break;
    }
}
    // Get District Election by ID
    private void getDistrictElectionById(HttpExchange exchange, int id) throws IOException {
        StringBuilder response = new StringBuilder();
        if (id <= 0) {
            String error = "❌ Invalid district election ID.";
            exchange.sendResponseHeaders(400, error.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(error.getBytes());
            }
            return;
        }
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT de.district_election_id, d.district_name, e.year, " +
                     "de.total_valid_votes_for_seat, de.disqualify_votes, de.disqualify_party_count, de.threshold_5_percent " +
                     "FROM district_election de " +
                     "JOIN district d ON de.district_id = d.district_id " +
                     "JOIN election e ON de.election_id = e.election_id " +
                     "WHERE de.district_election_id = ?")) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    response.append("ID: ").append(rs.getInt("district_election_id"))
                            .append(", District: ").append(rs.getString("district_name"))
                            .append(", Year: ").append(rs.getInt("year"))
                            .append(", Valid Votes: ").append(rs.getInt("total_valid_votes_for_seat"))
                            .append(", Disqualify Votes: ").append(rs.getInt("disqualify_votes"))
                            .append(", Disqualify Party Count: ").append(rs.getInt("disqualify_party_count"))
                            .append(", Threshold 5%: ").append(rs.getInt("threshold_5_percent"));
                    byte[] respBytes = response.toString().getBytes();
                    exchange.sendResponseHeaders(200, respBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(respBytes);
                    }
                } else {
                    String notFound = "❌ District election not found.";
                    exchange.sendResponseHeaders(404, notFound.length());
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(notFound.getBytes());
                    }
                }
            }
        } catch (Exception e) {
            String error = "❌ Error: " + e.getMessage();
            exchange.sendResponseHeaders(500, error.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(error.getBytes());
            }
        }
    }
    // GetAll District Elections
    private void getDistrictElections(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT de.district_election_id, d.district_name, e.year, " +
                     "de.total_valid_votes_for_seat, de.disqualify_votes, de.disqualify_party_count, de.threshold_5_percent " +
                     "FROM district_election de " +
                     "JOIN district d ON de.district_id = d.district_id " +
                     "JOIN election e ON de.election_id = e.election_id " +
                     "ORDER BY e.year DESC, d.district_name");
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                response.append("ID: ").append(rs.getInt("district_election_id"))
                        .append(", District: ").append(rs.getString("district_name"))
                        .append(", Year: ").append(rs.getInt("year"))
                        .append(", Valid Votes: ").append(rs.getInt("total_valid_votes_for_seat"))
                        .append(", Disqualify Votes: ").append(rs.getInt("disqualify_votes"))
                        .append(", Disqualify Party Count: ").append(rs.getInt("disqualify_party_count"))
                        .append(", Threshold 5%: ").append(rs.getInt("threshold_5_percent"))
                        .append("\n");
            }
        } catch (Exception e) {
            response.append("❌ Error: ").append(e.getMessage());
        }
        byte[] respBytes = response.toString().getBytes();
        exchange.sendResponseHeaders(200, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }

// Create District Election

    private void createDistrictElection(HttpExchange exchange) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();

    // Very basic JSON parsing (for demo; use a library like Gson/Jackson in production)
    int districtId = getJsonInt(requestBody, "district_id");
    int electionId = getJsonInt(requestBody, "election_id");
    int totalValidVotes = getJsonInt(requestBody, "total_valid_votes_for_seat");
    int disqualifyVotes = getJsonInt(requestBody, "disqualify_votes");
    int disqualifyPartyCount = getJsonInt(requestBody, "disqualify_party_count");
    int threshold5Percent = getJsonInt(requestBody, "threshold_5_percent");

    if (districtId == -1 || electionId == -1) {
        String response = "{\"status\":\"error\",\"message\":\"Missing required parameters.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    // Prevent negative total_valid_votes_for_seat
    if (totalValidVotes < 0) {
        String response = "{\"status\":\"error\",\"message\":\"total_valid_votes_for_seat cannot be negative.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    // Check for duplicate district_id and election_id
    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement checkStmt = conn.prepareStatement(
             "SELECT COUNT(*) FROM district_election WHERE district_id = ? AND election_id = ?")) {
        checkStmt.setInt(1, districtId);
        checkStmt.setInt(2, electionId);
        try (ResultSet rs = checkStmt.executeQuery()) {
            if (rs.next() && rs.getInt(1) > 0) {
                String response = "{\"status\":\"error\",\"message\":\"A district election with the same district_id and election_id already exists.\"}";
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(409, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }
        }
    } catch (Exception e) {
        String response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(500, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    String response;
    int statusCode;
    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement stmt = conn.prepareStatement(
                 "INSERT INTO district_election (total_valid_votes_for_seat, disqualify_votes, disqualify_party_count, threshold_5_percent, district_id, election_id) " +
                         "VALUES (?, ?, ?, ?, ?, ?)", PreparedStatement.RETURN_GENERATED_KEYS)) {
        stmt.setInt(1, totalValidVotes);
        stmt.setInt(2, disqualifyVotes);
        stmt.setInt(3, disqualifyPartyCount);
        stmt.setInt(4, threshold5Percent);
        stmt.setInt(5, districtId);
        stmt.setInt(6, electionId);
        int affectedRows = stmt.executeUpdate();
        if (affectedRows > 0) {
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    int districtElectionId = rs.getInt(1);
                    response = "{\"status\":\"success\",\"message\":\"District election created successfully\",\"district_election_id\":" + districtElectionId + "}";
                    statusCode = 201;
                } else {
                    response = "{\"status\":\"success\",\"message\":\"District election created, but could not retrieve ID.\"}";
                    statusCode = 201;
                }
            }
        } else {
            response = "{\"status\":\"error\",\"message\":\"Failed to create district election.\"}";
            statusCode = 500;
        }
    } catch (Exception e) {
        response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        statusCode = 500;
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, response.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(response.getBytes());
    }
}

// Update District Election

private void updateDistrictElection(HttpExchange exchange, int districtElectionId) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();

    int totalValidVotes = getJsonInt(requestBody, "total_valid_votes_for_seat");
    int disqualifyVotes = getJsonInt(requestBody, "disqualify_votes");
    int disqualifyPartyCount = getJsonInt(requestBody, "disqualify_party_count");
    int threshold5Percent = getJsonInt(requestBody, "threshold_5_percent");
    int districtId = getJsonInt(requestBody, "district_id");
    int electionId = getJsonInt(requestBody, "election_id");

    if (districtElectionId <= 0) {
        String response = "{\"status\":\"error\",\"message\":\"Missing or invalid district_election_id in URL.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    // Prevent updating to a duplicate district_id and election_id combination
    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement checkStmt = conn.prepareStatement(
             "SELECT COUNT(*) FROM district_election WHERE district_id = ? AND election_id = ? AND district_election_id <> ?")) {
        checkStmt.setInt(1, districtId);
        checkStmt.setInt(2, electionId);
        checkStmt.setInt(3, districtElectionId);
        try (ResultSet rs = checkStmt.executeQuery()) {
            if (rs.next() && rs.getInt(1) > 0) {
                String response = "{\"status\":\"error\",\"message\":\"A district election with the same district_id and election_id already exists.\"}";
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(409, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }
        }
    } catch (Exception e) {
        String response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(500, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    String response;
    int statusCode;
    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement stmt = conn.prepareStatement(
                 "UPDATE district_election SET total_valid_votes_for_seat = ?, disqualify_votes = ?, disqualify_party_count = ?, threshold_5_percent = ?, district_id = ?, election_id = ? WHERE district_election_id = ?")) {
        stmt.setInt(1, totalValidVotes);
        stmt.setInt(2, disqualifyVotes);
        stmt.setInt(3, disqualifyPartyCount);
        stmt.setInt(4, threshold5Percent);
        stmt.setInt(5, districtId);
        stmt.setInt(6, electionId);
        stmt.setInt(7, districtElectionId);
        int affectedRows = stmt.executeUpdate();
        if (affectedRows > 0) {
            response = "{\"status\":\"success\",\"message\":\"District election updated successfully.\"}";
            statusCode = 200;
        } else {
            response = "{\"status\":\"error\",\"message\":\"District election not found or not updated.\"}";
            statusCode = 404;
        }
    } catch (Exception e) {
        response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        statusCode = 500;
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, response.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(response.getBytes());
    }
}

// Delete District Election by ID
private void deleteDistrictElection(HttpExchange exchange, int districtElectionId) throws IOException {
    if (districtElectionId <= 0) {
        String response = "{\"status\":\"error\",\"message\":\"Missing or invalid district_election_id in URL.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    String response;
    int statusCode;
    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement stmt = conn.prepareStatement(
                 "DELETE FROM district_election WHERE district_election_id = ?")) {
        stmt.setInt(1, districtElectionId);
        int affectedRows = stmt.executeUpdate();
        if (affectedRows > 0) {
            response = "{\"status\":\"success\",\"message\":\"District election deleted successfully.\"}";
            statusCode = 200;
        } else {
            response = "{\"status\":\"error\",\"message\":\"District election not found.\"}";
            statusCode = 404;
        }
    } catch (Exception e) {
        response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        statusCode = 500;
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, response.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(response.getBytes());
    }
}

// Get all district elections for all districts by year
    private void get_DistrictElection_AllDistrictByYear(HttpExchange exchange, int year) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT de.district_election_id, d.district_name, e.year, " +
                     "de.total_valid_votes_for_seat, de.disqualify_votes, de.disqualify_party_count, de.threshold_5_percent " +
                     "FROM district_election de " +
                     "JOIN district d ON de.district_id = d.district_id " +
                     "JOIN election e ON de.election_id = e.election_id " +
                     "WHERE e.year = ? " +
                     "ORDER BY d.district_name")) {
            stmt.setInt(1, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    response.append("ID: ").append(rs.getInt("district_election_id"))
                            .append(", District: ").append(rs.getString("district_name"))
                            .append(", Year: ").append(rs.getInt("year"))
                            .append(", Valid Votes: ").append(rs.getInt("total_valid_votes_for_seat"))
                            .append(", Disqualify Votes: ").append(rs.getInt("disqualify_votes"))
                            .append(", Disqualify Party Count: ").append(rs.getInt("disqualify_party_count"))
                            .append(", Threshold 5%: ").append(rs.getInt("threshold_5_percent"))
                            .append("\n");
                }
            }
        } catch (Exception e) {
            response.append("❌ Error: ").append(e.getMessage());
        }
        byte[] respBytes = response.toString().getBytes();
        exchange.sendResponseHeaders(200, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }

// Helper for basic JSON integer extraction
private int getJsonInt(String json, String key) {
    String pattern = "\"" + key + "\"\\s*:\\s*(\\d+)";
    java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
    return m.find() ? Integer.parseInt(m.group(1)) : -1;
}
}