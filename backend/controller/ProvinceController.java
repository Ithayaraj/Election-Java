package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ProvinceController implements HttpHandler {
    
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Uncomment CORS headers if needed
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().add("Access-Control-Max-Age", "3600");
        
        // Handle OPTIONS request for CORS preflight
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.getResponseHeaders().set("Content-Type", "text/plain");
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath();
        // Normalize path by removing trailing slash
        path = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
        
        // Log the incoming request for debugging
        // System.out.println("Received " + method + " request for path: " + path);
        
        try {
            switch (method) {

                case "GET":
                    if (path.matches("/province/\\d+/districts")) {
                        getDistrictsByProvince(exchange);
                    } else if (path.matches("/province/\\d+/seats")) {
                        getSeatsByProvinceId(exchange);
                    } else if (path.matches("/province/\\d+")) {
                        getProvinceById(exchange);
                    } else if (path.equals("/province")) {
                        getAllProvinces(exchange);
                    } else {
                        sendMethodNotAllowed(exchange, "GET only allowed on /province, /province/{id}, /province/{id}/district, or /province/{id}/seats");
                    }
                    break;
                case "POST":
                    if (path.equals("/province")) {
                        createProvince(exchange);
                    } else {
                        sendMethodNotAllowed(exchange, "POST only allowed on /province");
                    }
                    break;
                case "PUT":
                    if (path.matches("/province/\\d+")) {
                        updateProvince(exchange);
                    } else {
                        sendMethodNotAllowed(exchange, "PUT only allowed on /province/{id}");
                    }
                    break;
                case "DELETE":
                    if (path.matches("/province/\\d+")) {
                        deleteProvince(exchange);
                    } else {
                        sendMethodNotAllowed(exchange, "DELETE only allowed on /province/{id}");
                    }
                    break;
                default:
                    sendMethodNotAllowed(exchange, "Method " + method + " not allowed");
            }
        } catch (Exception e) {
            String response = "{\"error\": \"Server error: " + e.getMessage() + "\"}";
            byte[] respBytes = response.getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, respBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(respBytes);
            }
        }
    }

    private void sendMethodNotAllowed(HttpExchange exchange, String message) throws IOException {
        String response = "{\"error\": \"" + message + "\"}";
        byte[] respBytes = response.getBytes();
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(405, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }
    
    private void getAllProvinces(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT province_id, province_name FROM province");
             ResultSet rs = stmt.executeQuery()) {

            response.append("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) response.append(",");
                response.append("{\"id\":").append(rs.getInt("province_id"))
                        .append(",\"name\":\"").append(rs.getString("province_name")).append("\"}");
                first = false;
            }
            response.append("]");
            sendResponse(exchange, 200, response.toString());
        } catch (Exception e) {
            throw new IOException("Failed to get provinces: " + e.getMessage());
        }
    }
    // Get Province by ID
    private void getProvinceById(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int provinceId;
        try {
            provinceId = Integer.parseInt(parts[parts.length - 1]);
        }
        catch (Exception e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid province ID format\"}");

            return;
        }
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
                PreparedStatement stmt = conn.prepareStatement(
                        "SELECT province_id, province_name FROM province WHERE province_id = ?")) {
            stmt.setInt(1, provinceId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    response.append("{\"id\":").append(rs.getInt("province_id"))
                            .append(",\"name\":\"").append(rs.getString("province_name")).append("\"}");
                }
                else {
                    sendResponse(exchange, 404, "{\"error\": \"Province not found\"}");
                    return;
                }
            }
            sendResponse(exchange, 200, response.toString());
        }
        catch (Exception e) {
            throw new IOException("Failed to get province: " + e.getMessage());
        }
    }
    // Get Districts by Province
    private void getDistrictsByProvince(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int provinceId;
        try {
            provinceId = Integer.parseInt(parts[parts.length - 2]);
        } catch (Exception e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid province ID\"}");
            return;
        }

        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT district_id, district_name, seat_count FROM district WHERE province_id = ?")) {
            stmt.setInt(1, provinceId);
            try (ResultSet rs = stmt.executeQuery()) {
                response.append("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) response.append(",");
                    response.append("{\"id\":").append(rs.getInt("district_id"))
                            .append(",\"name\":\"").append(rs.getString("district_name"))
                            .append("\",\"seats\":").append(rs.getInt("seat_count")).append("}");
                    first = false;
                }
                response.append("]");
            }
            sendResponse(exchange, 200, response.toString());
        } catch (Exception e) {
            throw new IOException("Failed to get districts: " + e.getMessage());
        }
    }
    // Get Seats by Province ID
    private void getSeatsByProvinceId(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    String[] parts = path.split("/");
    int provinceId;
    try {
        // Validate that the province ID is a valid integer
        String idStr = parts[parts.length - 2];
        provinceId = Integer.parseInt(idStr);
    } catch (Exception e) {
        sendResponse(exchange, 400, "{\"error\": \"Invalid province ID format\"}");
        return;
    }

    try (Connection conn = DatabaseConnector.getConnection();
         PreparedStatement stmt = conn.prepareStatement(
                 "SELECT p.province_name, COALESCE(SUM(d.seat_count),0) AS total_seats " +
                 "FROM province p LEFT JOIN district d ON p.province_id = d.province_id " +
                 "WHERE p.province_id = ? GROUP BY p.province_name")) {
        stmt.setInt(1, provinceId);
        try (ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                String provinceName = rs.getString("province_name");
                int totalSeats = rs.getInt("total_seats");
                String json = String.format("{\"province_name\":\"%s\",\"total_seats\":%d}", provinceName, totalSeats);
                sendResponse(exchange, 200, json);
            } else {
                sendResponse(exchange, 404, "{\"error\": \"Province not found\"}");
            }
        }
    } catch (Exception e) {
        throw new IOException("Failed to get seats by province ID: " + e.getMessage());
    }
}
// Create Province
    private void createProvince(HttpExchange exchange) throws IOException {
    String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
    String provinceName = null;

    // Very basic JSON parsing (for demo; use a library like Gson/Jackson in production)
    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"province_name\"\\s*:\\s*\"([^\"]+)\"").matcher(requestBody);
    if (m.find()) {
        provinceName = m.group(1).trim();
    }

    if (provinceName == null || provinceName.isEmpty()) {
        sendResponse(exchange, 400, "{\"error\": \"Province name cannot be empty.\"}");
        return;
    }

    if (provinceName.length() > 50 || !provinceName.matches("[A-Za-z ]+")) {
        sendResponse(exchange, 400, "{\"error\": \"Invalid province name. Must be 1-50 letters/spaces only.\"}");
        return;
    }

    try (Connection conn = DatabaseConnector.getConnection()) {
        try (PreparedStatement checkStmt = conn.prepareStatement(
                "SELECT COUNT(*) FROM province WHERE LOWER(province_name) = LOWER(?)")) {
            checkStmt.setString(1, provinceName);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    sendResponse(exchange, 409, "{\"error\": \"Province '" + provinceName + "' already exists.\"}");
                    return;
                }
            }
        }

        try (PreparedStatement insertStmt = conn.prepareStatement(
                "INSERT INTO province (province_name) VALUES (?)",
                PreparedStatement.RETURN_GENERATED_KEYS)) {
            insertStmt.setString(1, provinceName);
            int affectedRows = insertStmt.executeUpdate();

            if (affectedRows > 0) {
                try (ResultSet generatedKeys = insertStmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        int newId = generatedKeys.getInt(1);
                        sendResponse(exchange, 201, "{\"message\": \"Province '" + provinceName + "' created successfully.\", \"id\": " + newId + "}");
                    } else {
                        sendResponse(exchange, 201, "{\"message\": \"Province '" + provinceName + "' created successfully.\"}");
                    }
                }
            } else {
                sendResponse(exchange, 500, "{\"error\": \"Failed to create province.\"}");
            }
        }
    } catch (SQLException e) {
        sendResponse(exchange, 500, "{\"error\": \"Database error: " + e.getMessage() + "\"}");
    } catch (Exception e) {
        sendResponse(exchange, 500, "{\"error\": \"Unexpected error: " + e.getMessage() + "\"}");
    }
}
// Update Province
    private void updateProvince(HttpExchange exchange) throws IOException {
        InputStream requestBody = exchange.getRequestBody();
        String name = new String(requestBody.readAllBytes()).trim();
        requestBody.close();

        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int provinceId;
        try {
            provinceId = Integer.parseInt(parts[parts.length - 1]);
        } catch (Exception e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid province ID\"}");
            return;
        }

        if (name.isEmpty() || name.length() > 50 || !name.matches("[A-Za-z ]+")) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid province name. Must be 1-50 letters/spaces only.\"}");
            return;
        }

        try (Connection conn = DatabaseConnector.getConnection()) {
            try (PreparedStatement checkStmt = conn.prepareStatement(
                    "SELECT province_name FROM province WHERE province_id = ?")) {
                checkStmt.setInt(1, provinceId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (!rs.next()) {
                        sendResponse(exchange, 404, "{\"error\": \"Province not found.\"}");
                        return;
                    }
                }
            }

            try (PreparedStatement checkStmt = conn.prepareStatement(
                    "SELECT COUNT(*) FROM province WHERE LOWER(province_name) = LOWER(?) AND province_id <> ?")) {
                checkStmt.setString(1, name);
                checkStmt.setInt(2, provinceId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        sendResponse(exchange, 409, "{\"error\": \"Province name already exists.\"}");
                        return;
                    }
                }
            }
            
            try (PreparedStatement updateStmt = conn.prepareStatement(
                    "UPDATE province SET province_name = ? WHERE province_id = ?")) {
                updateStmt.setString(1, name);
                updateStmt.setInt(2, provinceId);
                int rows = updateStmt.executeUpdate();
                if (rows > 0) {
                    sendResponse(exchange, 200, "{\"message\": \"Province updated successfully.\"}");
                } else {
                    sendResponse(exchange, 500, "{\"error\": \"Failed to update province.\"}");
                }
            }
        } catch (Exception e) {
            throw new IOException("Failed to update province: " + e.getMessage());
        }
    }
// Delete Province
    private void deleteProvince(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int provinceId;
        try {
            provinceId = Integer.parseInt(parts[parts.length - 1]);
        } catch (Exception e) {
            sendResponse(exchange, 400, "{\"error\": \"Invalid province ID format\"}");
            return;
        }

        try (Connection conn = DatabaseConnector.getConnection()) {
            String provinceName = null;
            try (PreparedStatement nameStmt = conn.prepareStatement(
                    "SELECT province_name FROM province WHERE province_id = ?")) {
                nameStmt.setInt(1, provinceId);
                try (ResultSet rs = nameStmt.executeQuery()) {
                    if (rs.next()) {
                        provinceName = rs.getString("province_name");
                    } else {
                        sendResponse(exchange, 404, "{\"error\": \"Province not found.\"}");
                        return;
                    }
                }
            }

            try (PreparedStatement districtCheck = conn.prepareStatement(
                    "SELECT COUNT(*) FROM district WHERE province_id = ?")) {
                districtCheck.setInt(1, provinceId);
                try (ResultSet rs = districtCheck.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        sendResponse(exchange, 409, 
                            "{\"error\": \"Cannot delete province '" + provinceName + "' - it has associated districts.\"}");
                        return;
                    }
                }
            }

            try (PreparedStatement deleteStmt = conn.prepareStatement(
                    "DELETE FROM province WHERE province_id = ?")) {
                deleteStmt.setInt(1, provinceId);
                int rows = deleteStmt.executeUpdate();
                if (rows > 0) {
                    sendResponse(exchange, 200, 
                        "{\"message\": \"Province '" + provinceName + "' deleted successfully.\"}");
                } else {
                    sendResponse(exchange, 500, "{\"error\": \"Failed to delete province.\"}");
                }
            }
        } catch (SQLException e) {
            throw new IOException("Database error: " + e.getMessage());
        } catch (Exception e) {
            throw new IOException("Failed to delete province: " + e.getMessage());
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] respBytes = response.getBytes();
        exchange.sendResponseHeaders(statusCode, respBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(respBytes);
        }
    }
}