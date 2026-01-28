package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
// import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class PartyHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        switch (method) {
            case "GET":
                if (path.matches("/threshold_5_percent_below/parties/\\d{4}")) {
                    // Match /threshold_5_percent_below/parties/{year}
                    getPartiesBelowThreshold(exchange);
                } else if (path.matches("/party/\\d+")) {
                    getPartyById(exchange);
                    
                } else if (path.matches("/party/year/\\d{4}")) {
                    getPartiesByYear(exchange);
                } else {
                    getAllParties(exchange);
                }
                break;
            case "POST":
                if (path.matches("/party")) {
                    createParty(exchange);
                } else {
                    exchange.sendResponseHeaders(404, -1); // Not Found
                }
                break;
            case "PUT":
               if (path.matches("/party/\\d+")) {
                    updateParty(exchange);
                } else {
                    exchange.sendResponseHeaders(404, -1); // Not Found
                }
                break;
            case "DELETE":
                if (path.matches("/party/\\d+")) {
                        deleteParty(exchange);
                    } else {
                        exchange.sendResponseHeaders( 404, -1); // Not Found
                    }                break;
            default:
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                break;
            }
    }
//Get Party by ID
private void getPartyById(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    String[] parts = path.split("/");
    int partyId;
    try {
        partyId = Integer.parseInt(parts[parts.length - 1]);
    } catch (NumberFormatException e) {
        String json = "{\"status\":\"error\",\"message\":\"Invalid party ID format.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
        return;
    }

    String jsonResponse;
    int statusCode;

    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement stmt = conn.prepareStatement(
                 "SELECT party_id, party_name FROM party WHERE party_id = ?")) {
        stmt.setInt(1, partyId);
        try (ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                jsonResponse = String.format(
                    "{\"party_id\":%d,\"party_name\":\"%s\"}",
                    rs.getInt("party_id"),
                    rs.getString("party_name")
                );
                statusCode = 200;
            } else {
                jsonResponse = "{\"status\":\"error\",\"message\":\"Party not found.\"}";
                statusCode = 404;
            }
        }
    } catch (Exception e) {
        jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        statusCode = 500;
    }

    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, jsonResponse.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(jsonResponse.getBytes());
    }
}
// Get All Parties
    private void getAllParties(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT party_id, party_name FROM party ORDER BY party_name");
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                response.append(rs.getInt("party_id"))
                        .append(": ")
                        .append(rs.getString("party_name"))
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
// This method handles the creation of a party.
/**
 * Handles creation of a party with validation:
 * - Party name cannot be empty.
 * - Party name cannot be numeric.
 */
private void    createParty(HttpExchange exchange) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
    String partyName = null;

    // Very basic JSON parsing (for demo; use a library like Gson/Jackson in production)
    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"party_name\"\\s*:\\s*\"([^\"]+)\"").matcher(requestBody);
    if (m.find()) {
        partyName = m.group(1).trim();
    }

    String jsonResponse;
    int statusCode;

    // Validation
    if (partyName == null || partyName.isEmpty()) {
        jsonResponse = "{\"status\":\"error\",\"message\":\"Party name cannot be empty.\"}";
        statusCode = 400;
    } else if (partyName.matches("\\d+")) {
        jsonResponse = "{\"status\":\"error\",\"message\":\"Party name cannot be numeric.\"}";
        statusCode = 400;
    } else {
        // Try to insert into DB
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO party (party_name) VALUES (?)", PreparedStatement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, partyName);
            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        int partyId = rs.getInt(1);
                        jsonResponse = String.format(
                            "{\"status\":\"success\",\"message\":\"Party created successfully\",\"party_id\":%d,\"party_name\":\"%s\"}",
                            partyId, partyName
                        );
                        statusCode = 201;
                    } else {
                        jsonResponse = "{\"status\":\"success\",\"message\":\"Party created, but could not retrieve ID.\"}";
                        statusCode = 201;
                    }
                }
            } else {
                jsonResponse = "{\"status\":\"error\",\"message\":\"Failed to create party.\"}";
                statusCode = 500;
            }
        } catch (Exception e) {
            // Check for duplicate entry (optional: adjust message based on your DB)
            if (e.getMessage().toLowerCase().contains("duplicate")) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"Party name already exists.\"}";
                statusCode = 409;
            } else {
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
                statusCode = 500;
            }
        }
    }

    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, jsonResponse.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(jsonResponse.getBytes());
    }
}
// Update Party
private void updateParty(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    String[] parts = path.split("/");
    int partyId;
    try {
        partyId = Integer.parseInt(parts[parts.length - 1]);
    } catch (NumberFormatException e) {
        sendJsonResponse(exchange, 400, "Invalid party ID format.", false);
        return;
    }

    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
    String partyName = null;

    // Very basic JSON parsing (for demo; use a library like Gson/Jackson in production)
    java.util.regex.Matcher nameMatcher = java.util.regex.Pattern.compile("\"party_name\"\\s*:\\s*\"([^\"]+)\"").matcher(requestBody);
    if (nameMatcher.find()) {
        partyName = nameMatcher.group(1).trim();
    }

    // Validation
    if (partyName == null || partyName.isEmpty()) {
        sendJsonResponse(exchange, 400, "Party name cannot be empty.", false);
        return;
    }
    if (partyName.matches("\\d+")) {
        sendJsonResponse(exchange, 400, "Party name cannot be numeric.", false);
        return;
    }

    try (Connection conn = DatabaseConnector.getConnection()) {
        // Check for duplicate name (excluding current party)
        try (PreparedStatement checkStmt = conn.prepareStatement(
                "SELECT COUNT(*) FROM party WHERE LOWER(party_name) = LOWER(?) AND party_id <> ?")) {
            checkStmt.setString(1, partyName);
            checkStmt.setInt(2, partyId);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    sendJsonResponse(exchange, 409, "Party name already exists.", false);
                    return;
                }
            }
        }

        // Update party
        try (PreparedStatement stmt = conn.prepareStatement(
                "UPDATE party SET party_name = ? WHERE party_id = ?")) {
            stmt.setString(1, partyName);
            stmt.setInt(2, partyId);

            int rowsUpdated = stmt.executeUpdate();
            if (rowsUpdated > 0) {
                sendJsonResponse(exchange, 200, "Party updated successfully.", true);
            } else {
                sendJsonResponse(exchange, 404, "Party not found with ID: " + partyId, false);
            }
        }
    } catch (Exception e) {
        sendJsonResponse(exchange, 500, "Error: " + e.getMessage(), false);
    }
}
// Delete Party
private void deleteParty(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    String[] parts = path.split("/");
    int partyId;
    try {
        partyId = Integer.parseInt(parts[parts.length - 1]);
    } catch (NumberFormatException e) {
        String json = "{\"status\":\"error\",\"message\":\"Invalid party ID format.\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(400, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
        return;
    }
    String jsonResponse;
    int statusCode;
    try (Connection conn = DatabaseConnector.getConnection();
            PreparedStatement stmt = conn.prepareStatement("DELETE FROM party WHERE party_id = ?")) {
        stmt.setInt(1, partyId);
        int rowsAffected = stmt.executeUpdate();    
        if (rowsAffected > 0) {
            jsonResponse = "{\"status\":\"success\",\"message\":\"Party deleted successfully.\"}";
            statusCode = 200;
        } else {
            jsonResponse = "{\"status\":\"error\",\"message\":\"Party not found.\"}";
            statusCode = 404;
        }   
    }
    catch (Exception e) {
        jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
        statusCode = 500;
    }
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(statusCode, jsonResponse.getBytes().length);
    try (OutputStream os = exchange.getResponseBody()) {
        os.write(jsonResponse.getBytes());
    }
    }
     private void sendJsonResponse(HttpExchange exchange, int statusCode, String message, boolean success) throws IOException {
        String json = String.format("{\"success\": %s, \"message\": \"%s\"}", success, message.replace("\"", "\\\""));
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }}
    // List parties that are below threshold_5_percent in any district_election for a given year
    private void getPartiesBelowThreshold(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int year;
        try {
            year = Integer.parseInt(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            String errorJson = "{\"status\":\"error\",\"message\":\"Invalid year format.\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(400, errorJson.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorJson.getBytes());
            }
            return;
        }

        StringBuilder json = new StringBuilder();
        json.append("[");
        boolean first = true;
        String sql =
            "SELECT DISTINCT p.party_name " +
            "FROM party p " +
            "JOIN party_votes pv ON p.party_id = pv.party_id " +
            "JOIN district_election de ON pv.district_election_id = de.district_election_id " +
            "WHERE pv.votes < de.threshold_5_percent AND de.year = ?";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("\"").append(rs.getString("party_name").replace("\"", "\\\"")).append("\"");
                    first = false;
                }
            }
        } catch (Exception e) {
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorJson.getBytes());
            }
            return;
        }
        json.append("]");
        byte[] respBytes = json.toString().getBytes();
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }

    // Get all parties that participated in a given year (year passed as path param)
    private void getPartiesByYear(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int year;
        // Expecting path: /party/year/{year}
        if (parts.length >= 4) {
            try {
                year = Integer.parseInt(parts[3]);
            } catch (NumberFormatException e) {
                String errorJson = "{\"status\":\"error\",\"message\":\"Invalid year format in URL.\"}";
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(400, errorJson.getBytes().length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorJson.getBytes());
                }
                return;
            }
        } else {
            String errorJson = "{\"status\":\"error\",\"message\":\"Year not specified in URL.\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(400, errorJson.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorJson.getBytes());
            }
            return;
        }

        StringBuilder json = new StringBuilder();
        json.append("[");
        boolean first = true;
        String sql =
            "SELECT DISTINCT p.party_id, p.party_name " +
            "FROM party p " +
            "JOIN party_votes pv ON p.party_id = pv.party_id " +
            "JOIN district_election de ON pv.district_election_id = de.district_election_id " +
            "JOIN election e ON de.election_id = e.election_id " +
            "WHERE e.year = ?";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append(String.format("{\"party_id\":%d,\"party_name\":\"%s\"}",
                        rs.getInt("party_id"),
                        rs.getString("party_name").replace("\"", "\\\"")));
                    first = false;
                }
            }
        } catch (Exception e) {
            String errorJson = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, errorJson.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorJson.getBytes());
            }
            return;
        }
        json.append("]");
        byte[] respBytes = json.toString().getBytes();
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }
}