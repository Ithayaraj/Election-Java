package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class ElectionHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Content-Type", "application/json");

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");

        // Add switch for /elections/years
        if (path.equals("/elections/years") && method.equals("GET")) {
            getElectionYears(exchange);
            return;
        }

        switch (method) {
            
            case "GET":
                // Check if path is /election/{year}
                if (parts.length == 3 && !parts[2].isEmpty()) {
                    try {
                        int year = Integer.parseInt(parts[2]);
                        if (year <= 0) {
                            String response = "❌ Year must be a positive, non-zero value.";
                            exchange.sendResponseHeaders(400, response.length());
                            try (OutputStream os = exchange.getResponseBody()) {
                                os.write(response.getBytes());
                            }
                            return;
                        }
                        getElectionByYear(exchange, year);
                    } catch (NumberFormatException e) {
                        String response = "❌ Invalid year format in URL.";
                        exchange.sendResponseHeaders(400, response.length());
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                    }
                } else {
                    getElections(exchange);
                }
                break;
                
            case "POST":
                createElection(exchange);
                break;
            case "DELETE":
                // Extract year from URL path and pass to deleteElection
                if (parts.length == 3 && !parts[2].isEmpty()) {
                    try {
                        int year = Integer.parseInt(parts[2]);
                        if (year <= 0) {
                            String response = "❌ Year must be a positive, non-zero value.";
                            exchange.sendResponseHeaders(400, response.length());
                            try (OutputStream os = exchange.getResponseBody()) {
                                os.write(response.getBytes());
                            }
                            return;
                        }
                        deleteElection(exchange, year);
                    } catch (NumberFormatException e) {
                        String response = "❌ Invalid year format in URL.";
                        exchange.sendResponseHeaders(400, response.length());
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                    }
                } else {
                    String response = "❌ Year not specified in URL.";
                    exchange.sendResponseHeaders(400, response.length());
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(response.getBytes());
                    }
                }
                break;
            default:
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                break;
        }
    }

    private void getElections(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT election_id, year FROM election ORDER BY year DESC");
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                response.append(rs.getInt("election_id"))
                        .append(": ")
                        .append(rs.getInt("year"))
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

    private void createElection(HttpExchange exchange) throws IOException {
        String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
        int year;
        try {
            // Minimal manual JSON parsing for {"year": 2024}
            String yearStr = requestBody.replaceAll("[^0-9]", "");
            year = Integer.parseInt(yearStr);
            if (year <= 0) {
                String response = "❌ Year must be a positive, non-zero value.";
                exchange.sendResponseHeaders(400, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }
        } catch (Exception e) {
            String response = "❌ Invalid JSON format or missing 'year'.";
            exchange.sendResponseHeaders(400, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
            return;
        }
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Check for duplicate year
            try (PreparedStatement checkStmt = conn.prepareStatement(
                    "SELECT COUNT(*) FROM election WHERE year = ?")) {
                checkStmt.setInt(1, year);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        String response = "❌ Election for year " + year + " already exists.";
                        exchange.sendResponseHeaders(409, response.length());
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }
                }
            }
            try (PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO election (year) VALUES (?)", PreparedStatement.RETURN_GENERATED_KEYS)) {
                stmt.setInt(1, year);
                int affectedRows = stmt.executeUpdate();
                String response;
                if (affectedRows > 0) {
                    try (ResultSet rs = stmt.getGeneratedKeys()) {
                        if (rs.next()) {
                            int electionId = rs.getInt(1);
                            response = "Election created successfully with ID: " + electionId + " and year: " + year;
                            exchange.sendResponseHeaders(201, response.length());
                        } else {
                            response = "Election created, but could not retrieve ID.";
                            exchange.sendResponseHeaders(201, response.length());
                        }
                    }
                } else {
                    response = "Failed to create election.";
                    exchange.sendResponseHeaders(500, response.length());
                }
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            }
        } catch (Exception e) {
            String response = "❌ Error: " + e.getMessage();
            exchange.sendResponseHeaders(500, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        }
    }

    // Modified to accept year as parameter
    private void deleteElection(HttpExchange exchange, int year) throws IOException {
        try (Connection conn = DatabaseConnector.getConnection()) {
            // First, get the election_id for the given year
            int electionId = -1;
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT election_id FROM election WHERE year = ?")) {
                stmt.setInt(1, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        electionId = rs.getInt("election_id");
                    } else {
                        String response = "❌ Election year not found.";
                        exchange.sendResponseHeaders(404, response.length());
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }
                }
            }

            // Check if this election_id is referenced in district_election
            try (PreparedStatement checkStmt = conn.prepareStatement(
                    "SELECT COUNT(*) FROM district_election WHERE election_id = ?")) {
                checkStmt.setInt(1, electionId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        String response = "❌ Cannot delete: Election is referenced in district_election.";
                        exchange.sendResponseHeaders(409, response.length());
                        try (OutputStream os = exchange.getResponseBody()) {
                            os.write(response.getBytes());
                        }
                        return;
                    }
                }
            }

            // Safe to delete
            try (PreparedStatement delStmt = conn.prepareStatement(
                    "DELETE FROM election WHERE election_id = ?")) {
                delStmt.setInt(1, electionId);
                int affectedRows = delStmt.executeUpdate();
                String response;
                if (affectedRows > 0) {
                    response = "Election for year " + year + " deleted successfully.";
                    exchange.sendResponseHeaders(200, response.length());
                } else {
                    response = "❌ Failed to delete election.";
                    exchange.sendResponseHeaders(500, response.length());
                }
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
            }
        } catch (Exception e) {
            String response = "❌ Error: " + e.getMessage();
            exchange.sendResponseHeaders(500, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        }
    }

    // Fetch a particular election by year
    private void getElectionByYear(HttpExchange exchange, int year) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT election_id, year FROM election WHERE year = ?")) {
            stmt.setInt(1, year);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    response.append("Election ID: ")
                            .append(rs.getInt("election_id"))
                            .append(", Year: ")
                            .append(rs.getInt("year"));
                    byte[] respBytes = response.toString().getBytes();
                    exchange.sendResponseHeaders(200, respBytes.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(respBytes);
                    }
                } else {
                    String notFound = "❌ Election for year " + year + " not found.";
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

    // Returns all election years as a JSON array
    private void getElectionYears(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        response.append("[");
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT year FROM election ORDER BY year DESC");
             ResultSet rs = stmt.executeQuery()) {

            boolean first = true;
            while (rs.next()) {
                if (!first) {
                    response.append(",");
                }
                response.append(rs.getInt("year"));
                first = false;
            }
        } catch (Exception e) {
            String errorJson = "{\"error\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}";
            byte[] respBytes = errorJson.getBytes();
            exchange.sendResponseHeaders(500, respBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(respBytes);
            }
            return;
        }
        response.append("]");
        byte[] respBytes = response.toString().getBytes();
        exchange.sendResponseHeaders(200, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }
}