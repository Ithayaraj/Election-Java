package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class SeatAllocationHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        // Route for total seats by party and year
        // if (method.equals("GET") && path.endsWith("/seat_allocation/total")) {
        //     totalSeatsAllocatedPartyAllDistricts(exchange);
        //     return;
        // }

        switch (method) {
            case "GET":
                if (path.endsWith("/seat_allocation/total")) {
                    totalSeatsAllocatedPartyAllDistricts(exchange);
                } else if (path.endsWith("/seat_allocation/party")) {
                    getSeatAllocationsByParty(exchange);
                } else {
                    getSeatAllocations(exchange);
                }
                break;
            case "POST":
                createSeatAllocation(exchange);
                break;
                
            case "PUT":
                if (path.matches(".*/seat_allocation/update/\\d+$")) {
                    updateSeatAllocation(exchange);
                } else {
                    exchange.sendResponseHeaders(404, -1);
                }
                break;
            case "DELETE":
                if (path.matches(".*/seat_allocation/delete/\\d+$")) {
                    deleteSeatAllocation(exchange);
                } else {
                    exchange.sendResponseHeaders(404, -1);
                }
                break;
            default:
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                break;
        }
    }

    private void getSeatAllocations(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT sa.seat_allocation_id, d.district_name, p.party_name, " +
                     "sa.bonus_round, sa.first_round, sa.second_round, sa.final_allocation " +
                     "FROM seat_allocation sa " +
                     "JOIN district_election de ON sa.district_election_id = de.district_election_id " +
                     "JOIN district d ON de.district_id = d.district_id " +
                     "JOIN party p ON sa.party_id = p.party_id " +
                     "ORDER BY d.district_name, p.party_name");
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                response.append("ID: ").append(rs.getInt("seat_allocation_id"))
                        .append(", District: ").append(rs.getString("district_name"))
                        .append(", Party: ").append(rs.getString("party_name"))
                        .append(", Bonus: ").append(rs.getInt("bonus_round"))
                        .append(", First: ").append(rs.getInt("first_round"))
                        .append(", Second: ").append(rs.getInt("second_round"))
                        .append(", Final: ").append(rs.getInt("final_allocation"))
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
// Seat Allocation Creation Handler

    private void createSeatAllocation(HttpExchange exchange) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();

    // Very basic JSON parsing (for demo; use a library like Gson/Jackson in production)
    int districtElectionId = getJsonInt(requestBody, "district_election_id");
    int partyId = getJsonInt(requestBody, "party_id");
    int bonusRound = getJsonInt(requestBody, "bonus_round");
    int firstRound = getJsonInt(requestBody, "first_round");
    int secondRound = getJsonInt(requestBody, "second_round");
    int finalAllocation = getJsonInt(requestBody, "final_allocation");

    if (districtElectionId == -1 || partyId == -1) {
        String response = "{\"status\":\"error\",\"message\":\"Missing required parameters: district_election_id and party_id are required.\"}";
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
                 "INSERT INTO seat_allocation (bonus_round, first_round, second_round, final_allocation, district_election_id, party_id) " +
                         "VALUES (?, ?, ?, ?, ?, ?)", PreparedStatement.RETURN_GENERATED_KEYS)) {
        stmt.setInt(1, bonusRound);
        stmt.setInt(2, firstRound);
        stmt.setInt(3, secondRound);
        stmt.setInt(4, finalAllocation);
        stmt.setInt(5, districtElectionId);
        stmt.setInt(6, partyId);
        int affectedRows = stmt.executeUpdate();
        if (affectedRows > 0) {
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    int seatAllocationId = rs.getInt(1);
                    response = "{\"status\":\"success\",\"message\":\"Seat allocation created successfully\",\"seat_allocation_id\":" + seatAllocationId + "}";
                    statusCode = 201;
                } else {
                    response = "{\"status\":\"success\",\"message\":\"Seat allocation created, but could not retrieve ID.\"}";
                    statusCode = 201;
                }
            }
        } else {
            response = "{\"status\":\"error\",\"message\":\"Failed to create seat allocation.\"}";
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

// New method: total seats allocated to a party in all districts for a given year
private void totalSeatsAllocatedPartyAllDistricts(HttpExchange exchange) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
    String partyName = getJsonString(requestBody, "party_name");
    String yearStr = getJsonString(requestBody, "year");

    String response;
    int statusCode = 200;
    if (partyName == null || yearStr == null) {
        response = "{\"status\":\"error\",\"message\":\"Missing required parameters: party_name and year are required.\"}";
        statusCode = 400;
    } else {
        try (Connection conn = DatabaseConnector.getConnection();

             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT SUM(sa.final_allocation) AS total_seats " +
                 "FROM seat_allocation sa " +
                 "JOIN party p ON sa.party_id = p.party_id " +
                 "JOIN district_election de ON sa.district_election_id = de.district_election_id " +
                 "JOIN election e ON de.election_id = e.election_id " +
                 "WHERE p.party_name = ? AND e.year = ?"
             )) {
            stmt.setString(1, partyName);
            stmt.setInt(2, Integer.parseInt(yearStr));
            try (ResultSet rs = stmt.executeQuery()) {
                int totalSeats = 0;
                if (rs.next()) {
                    totalSeats = rs.getInt("total_seats");
                }
                response = "{\"status\":\"success\",\"party_name\":\"" + partyName + "\",\"year\":" + yearStr + ",\"total_seats\":" + totalSeats + "}";
            }
        } catch (Exception e) {
            response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
            statusCode = 500;
        }
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, response.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(response.getBytes());
    }
}

// Update seat allocation with validation (id from URL, all columns updatable, non-negative check)

private void updateSeatAllocation(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    String[] parts = path.split("/");
    int seatAllocationId = -1;
    try {
        seatAllocationId = Integer.parseInt(parts[parts.length - 1]);
    } catch (Exception e) {
        String response = "{\"status\":\"error\",\"message\":\"Invalid or missing seat_allocation_id in URL.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
        return;
    }

    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
    int districtElectionId = getJsonInt(requestBody, "district_election_id");
    int partyId = getJsonInt(requestBody, "party_id");
    int bonusRound = getJsonInt(requestBody, "bonus_round");
    int firstRound = getJsonInt(requestBody, "first_round");
    int secondRound = getJsonInt(requestBody, "second_round");
    int finalAllocation = getJsonInt(requestBody, "final_allocation");

    String response;
    int statusCode = 200;

    // Validate required fields and non-negative numbers
    if (districtElectionId == -1 || partyId == -1 || bonusRound < 0 || firstRound < 0 || secondRound < 0 || finalAllocation < 0) {
        response = "{\"status\":\"error\",\"message\":\"Missing or invalid parameters: district_election_id, party_id, bonus_round, first_round, second_round, and final_allocation are required and must be non-negative.\"}";
        statusCode = 400;
    } else {
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Get district_id and seat_count via district_election join with district
            int districtId = -1;
            int districtSeatCount = -1;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT de.district_id, d.seat_count " +
                    "FROM district_election de " +
                    "JOIN district d ON de.district_id = d.district_id " +
                    "WHERE de.district_election_id = ?")) {
                ps.setInt(1, districtElectionId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        districtId = rs.getInt("district_id");
                        districtSeatCount = rs.getInt("seat_count");
                    }
                }
            }
            if (districtId == -1) {
                response = "{\"status\":\"error\",\"message\":\"district_election_id does not exist.\"}";
                statusCode = 400;
            } else {
                // Check for bonus seat constraint
                if (bonusRound > 0) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "SELECT COUNT(*) AS bonus_count FROM seat_allocation " +
                            "WHERE district_election_id = ? AND bonus_round > 0 AND seat_allocation_id <> ?")) {
                        ps.setInt(1, districtElectionId);
                        ps.setInt(2, seatAllocationId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next() && rs.getInt("bonus_count") > 0) {
                                response = "{\"status\":\"error\",\"message\":\"Bonus seat already allocated for this district. Only one bonus seat allowed per district.\"}";
                                statusCode = 400;
                                exchange.getResponseHeaders().set("Content-Type", "application/json");
                                exchange.sendResponseHeaders(statusCode, response.getBytes().length);
                                try (OutputStream os = exchange.getResponseBody()) {
                                    os.write(response.getBytes());
                                }
                                return;
                            }
                        }
                    }
                }
                // Calculate total final_allocation for this district_election_id, replacing the old value for this seat_allocation_id
                int currentTotal = 0;
                int oldFinalAllocation = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT SUM(final_allocation) AS total, " +
                        "(SELECT final_allocation FROM seat_allocation WHERE seat_allocation_id = ?) AS old_value " +
                        "FROM seat_allocation WHERE district_election_id = ?")) {
                    ps.setInt(1, seatAllocationId);
                    ps.setInt(2, districtElectionId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            currentTotal = rs.getInt("total");
                            oldFinalAllocation = rs.getInt("old_value");
                        }
                    }
                }
                int newTotal = currentTotal - oldFinalAllocation + finalAllocation;
                if (newTotal > districtSeatCount) {
                    response = "{\"status\":\"error\",\"message\":\"Total final_allocation exceeds district seat_count (" + districtSeatCount + ").\"}";
                    statusCode = 400;
                } else {
                    // Update all columns
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE seat_allocation SET bonus_round = ?, first_round = ?, second_round = ?, final_allocation = ?, district_election_id = ?, party_id = ? WHERE seat_allocation_id = ?")) {
                        ps.setInt(1, bonusRound);
                        ps.setInt(2, firstRound);
                        ps.setInt(3, secondRound);
                        ps.setInt(4, finalAllocation);
                        ps.setInt(5, districtElectionId);
                        ps.setInt(6, partyId);
                        ps.setInt(7, seatAllocationId);
                        int affected = ps.executeUpdate();
                        if (affected > 0) {
                            response = "{\"status\":\"success\",\"message\":\"Seat allocation updated successfully.\"}";
                        } else {
                            response = "{\"status\":\"error\",\"message\":\"Seat allocation not found or not updated.\"}";
                            statusCode = 404;
                        }
                    }
                }
            }
        } catch (Exception e) {
            response = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
            statusCode = 500;
        }
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, response.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(response.getBytes());
    }
}

// Delete seat allocation by seat_allocation_id from URL
private void deleteSeatAllocation(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int seatAllocationId = -1;
        try {
            seatAllocationId = Integer.parseInt(parts[parts.length - 1]);
        } catch (Exception e) {
            String response = "{\"status\":\"error\",\"message\":\"Invalid or missing seat_allocation_id in URL.\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(400, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
            return;
        }

        String response;
        int statusCode = 200;
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "DELETE FROM seat_allocation WHERE seat_allocation_id = ?")) {
            stmt.setInt(1, seatAllocationId);
            int affected = stmt.executeUpdate();
            if (affected > 0) {
                response = "{\"status\":\"success\",\"message\":\"Seat allocation deleted successfully.\"}";
            } else {
                response = "{\"status\":\"error\",\"message\":\"Seat allocation not found.\"}";
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

// New: Get seat allocations for a particular party, grouped by year
private void getSeatAllocationsByParty(HttpExchange exchange) throws IOException {
        String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
        String partyName = getJsonString(requestBody, "party_name");

        StringBuilder response = new StringBuilder();
        int statusCode = 200;
        if (partyName == null) {
            response.append("{\"status\":\"error\",\"message\":\"Missing required parameter: party_name.\"}");
            statusCode = 400;
        } else {
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(
                     "SELECT e.year, d.district_name, sa.bonus_round, sa.first_round, sa.second_round, sa.final_allocation " +
                     "FROM seat_allocation sa " +
                     "JOIN party p ON sa.party_id = p.party_id " +
                     "JOIN district_election de ON sa.district_election_id = de.district_election_id " +
                     "JOIN election e ON de.election_id = e.election_id " +
                     "JOIN district d ON de.district_id = d.district_id " +
                     "WHERE p.party_name = ? " +
                     "ORDER BY e.year, d.district_name"
                 )) {
                stmt.setString(1, partyName);
                try (ResultSet rs = stmt.executeQuery()) {
                    response.append("[");
                    boolean first = true;
                    while (rs.next()) {
                        if (!first) response.append(",");
                        response.append("{")
                                .append("\"year\":").append(rs.getInt("year")).append(",")
                                .append("\"district\":\"").append(rs.getString("district_name")).append("\",")
                                .append("\"bonus_round\":").append(rs.getInt("bonus_round")).append(",")
                                .append("\"first_round\":").append(rs.getInt("first_round")).append(",")
                                .append("\"second_round\":").append(rs.getInt("second_round")).append(",")
                                .append("\"final_allocation\":").append(rs.getInt("final_allocation"))
                                .append("}");
                        first = false;
                    }
                    response.append("]");
                }
            } catch (Exception e) {
                response.setLength(0);
                response.append("{\"status\":\"error\",\"message\":\"").append(e.getMessage().replace("\"", "'")).append("\"}");
                statusCode = 500;
            }
        }
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, response.toString().getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.toString().getBytes());
        }
    }

// Helper for basic JSON integer extraction
private int getJsonInt(String json, String key) {
    String pattern = "\"" + key + "\"\\s*:\\s*(-?\\d+)";
    java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
    return m.find() ? Integer.parseInt(m.group(1)) : -1;
}

// Helper for basic JSON string extraction
private String getJsonString(String json, String key) {
    String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]*)\"";
    java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
    return m.find() ? m.group(1) : null;
}
}