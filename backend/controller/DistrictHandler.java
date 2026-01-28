package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class DistrictHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().add("Access-Control-Max-Age", "3600");

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.getResponseHeaders().set("Content-Type", "text/plain");
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath();
        path = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;

        try {
            // Add support for /districts/nonzero endpoint
           
            
            switch (method) {

                case "GET":
                    if (path.matches("/districts/\\d+")) {
                        getDistrictById(exchange);
                    } else if (path.equals("/districts")) {
                        getAllDistricts(exchange);
                    } else if (method.equals("GET") && path.equals("/districts/nonzero")) {
                        getAllDistrict_NonZeroSeats(exchange);
                    }
                    else {
                        sendErrorResponse(exchange, 405, "GET only allowed on /districts or /districts/{id}");
                    }
                    break;
                case "POST":
                    if (path.equals("/districts")) {
                        insertDistrict(exchange);
                    } else if (path.equals("/districts/multiple")) {
                        insertMultipleDistricts(exchange);
                    } else {
                        sendErrorResponse(exchange, 405, "POST only allowed on /districts or /districts/multiple");
                    }
                    break;
                case "PUT":
                    if (path.matches("/districts/\\d+")) {
                        updateDistrict(exchange);
                    } else {
                        sendErrorResponse(exchange, 405, "PUT only allowed on /districts/{id}");
                    }
                    break;

                case "DELETE":
                    if (path.matches("/districts/\\d+")) {
                        deleteDistrict(exchange);
                    } else {
                        sendErrorResponse(exchange, 405, "DELETE only allowed on /districts/{id}");
                    }
                    break;
                default:
                    sendErrorResponse(exchange, 405, "Method " + method + " not allowed");
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Server error: " + e.getMessage());
        }
    }

    // Get all districts
    private void getAllDistricts(HttpExchange exchange) throws IOException {
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT district_id, district_name, seat_count, province_id FROM district");
             ResultSet rs = stmt.executeQuery()) {

            List<District> allDistricts = new ArrayList<>();
            while (rs.next()) {
                allDistricts.add(new District(
                        rs.getInt("district_id"),
                        rs.getString("district_name"),
                        rs.getInt("seat_count"),
                        rs.getInt("province_id")
                ));
            }
            sendJsonResponse(exchange, 200, allDistricts);
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }
    // Get all districts with non-zero seat_count
    private void getAllDistrict_NonZeroSeats(HttpExchange exchange) throws IOException {
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT district_id, district_name, seat_count, province_id FROM district WHERE seat_count > 0");
             ResultSet rs = stmt.executeQuery()) {

            List<District> nonZeroDistricts = new ArrayList<>();
            while (rs.next()) {
                nonZeroDistricts.add(new District(
                        rs.getInt("district_id"),
                        rs.getString("district_name"),
                        rs.getInt("seat_count"),
                        rs.getInt("province_id")
                ));
            }
            sendJsonResponse(exchange, 200, nonZeroDistricts);
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }
    // Get single district by ID
    private void getDistrictById(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int id;
        try {
            id = Integer.parseInt(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            sendErrorResponse(exchange, 400, "Invalid district ID format");
            return;
        }

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT district_id, district_name, seat_count, province_id FROM district WHERE district_id = ?")) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    District getDistrict = new District(
                            rs.getInt("district_id"),
                            rs.getString("district_name"),
                            rs.getInt("seat_count"),
                            rs.getInt("province_id")
                    );
                    sendJsonResponse(exchange, 200, getDistrict);
                } else {
                    sendErrorResponse(exchange, 404, "District not found");
                }
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    // Insert new district
   // ...existing code...
    // Insert new district
    private void insertDistrict(HttpExchange exchange) throws IOException {
        try {
            String body = new String(exchange.getRequestBody().readAllBytes());
            District createDistrict = parseDistrictFromJson(body);

            String districtName = createDistrict.getDistrictName();
            // Disallow null, empty, or only whitespace district name
            if (districtName == null || districtName.trim().isEmpty() ||
                    createDistrict.getSeatCount() < 0 || createDistrict.getProvinceId() <= 0) {
                sendErrorResponse(exchange, 400, "Invalid input data: District name cannot be empty or spaces only.");
                return;
            }

            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(
                         "INSERT INTO district (district_name, seat_count, province_id) VALUES (?, ?, ?)")) {

                stmt.setString(1, districtName.trim());
                stmt.setInt(2, createDistrict.getSeatCount());
                stmt.setInt(3, createDistrict.getProvinceId());

                stmt.executeUpdate();
                sendSuccessResponse(exchange, 201, "District created successfully");
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }
    // Insert multiple districts
    private void insertMultipleDistricts(HttpExchange exchange) throws IOException {
        try {
            String body = new String(exchange.getRequestBody().readAllBytes());
            // Expecting a JSON array of districts
            List<District> multipleDistricts = parseDistrictListFromJson(body);

            if (multipleDistricts == null || multipleDistricts.isEmpty()) {
                sendErrorResponse(exchange, 400, "Input must be a non-empty array of districts");
                return;
            }

            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(
                         "INSERT INTO district (district_name, seat_count, province_id) VALUES (?, ?, ?)")) {

                for (District d : multipleDistricts) {
                    String districtName = d.getDistrictName();
                    if (districtName == null || districtName.trim().isEmpty() ||
                        d.getSeatCount() < 0 || d.getProvinceId() <= 0) {
                        sendErrorResponse(exchange, 400, "Invalid input data in one or more districts");
                        return;
                    }
                    stmt.setString(1, districtName.trim());
                    stmt.setInt(2, d.getSeatCount());
                    stmt.setInt(3, d.getProvinceId());
                    stmt.addBatch();
                }
                stmt.executeBatch();
                sendSuccessResponse(exchange, 201, "Multiple districts created successfully");
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    // Helper to parse a JSON array of districts (very basic, for demo only)
    private List<District> parseDistrictListFromJson(String json) {
        List<District> list = new ArrayList<>();
        // Very naive split, assumes no nested objects or arrays in fields
        String[] items = json.replaceAll("^\\s*\\[|\\]\\s*$", "").split("\\},\\s*\\{");
        for (String item : items) {
            String obj = item;
            if (!obj.startsWith("{")) obj = "{" + obj;
            if (!obj.endsWith("}")) obj = obj + "}";
            District d = parseDistrictFromJson(obj);
            if (d != null) list.add(d);
        }
        return list;
    }
    // Update district (extract district_id from URL, update all fields)
    private void updateDistrict(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int districtId;
        try {
            districtId = Integer.parseInt(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            sendErrorResponse(exchange, 400, "Invalid district ID format");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes());
        District updateDistrict = parseDistrictFromJson(body);

        if (updateDistrict.getDistrictName() == null || updateDistrict.getDistrictName().isEmpty() ||
            updateDistrict.getSeatCount() < 0 ||
            updateDistrict.getProvinceId() <= 0) {
            sendErrorResponse(exchange, 400, "Invalid input data");
            return;
        }

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 "UPDATE district SET district_name = ?, seat_count = ?, province_id = ? WHERE district_id = ?")) {

            stmt.setString(1, updateDistrict.getDistrictName());
            stmt.setInt(2, updateDistrict.getSeatCount());
            stmt.setInt(3, updateDistrict.getProvinceId());
            stmt.setInt(4, districtId);

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                sendSuccessResponse(exchange, 200, "District updated successfully");
            } else {
                sendErrorResponse(exchange, 404, "District not found");
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    // Delete district
    private void deleteDistrict(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String[] parts = path.split("/");
        int id;
        try {
            id = Integer.parseInt(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            sendErrorResponse(exchange, 400, "Invalid district ID format");
            return;
        }

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "DELETE FROM district WHERE district_id = ?")) {

            stmt.setInt(1, id);
            int rows = stmt.executeUpdate();

            if (rows > 0) {
                sendSuccessResponse(exchange, 200, "District deleted successfully");
            } else {
                sendErrorResponse(exchange, 404, "District not found");
            }
        } catch (Exception e) {
            sendErrorResponse(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    // Helper methods
    private District parseDistrictFromJson(String json) {
        // Simple JSON parsing (for demo; use a library like Gson/Jackson in production)
        return new District(
                getJsonInt(json, "district_id"),
                getJsonString(json, "district_name"),
                getJsonInt(json, "seat_count"),
                getJsonInt(json, "province_id")
        );
    }

    private String getJsonString(String json, String key) {
        String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]*)\"";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private int getJsonInt(String json, String key) {
        String pattern = "\"" + key + "\"\\s*:\\s*(\\d+)";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        return m.find() ? Integer.parseInt(m.group(1)) : -1;
    }

    private void sendJsonResponse(HttpExchange exchange, int status, Object data) throws IOException {
        String json = convertToJson(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }

    private void sendSuccessResponse(HttpExchange exchange, int status, String message) throws IOException {
        String json = "{\"status\":\"success\",\"message\":\"" + message + "\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }

    private void sendErrorResponse(HttpExchange exchange, int status, String error) throws IOException {
        String json = "{\"status\":\"error\",\"message\":\"" + error + "\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, json.getBytes().length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }

    private String convertToJson(Object data) {
        if (data instanceof District) {
            District d = (District) data;
            return String.format(
                    "{\"district_id\":%d,\"district_name\":\"%s\",\"seat_count\":%d,\"province_id\":%d}",
                    d.getDistrictId(), d.getDistrictName(), d.getSeatCount(), d.getProvinceId()
            );
        } else if (data instanceof List) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : (List<?>) data) {
                if (!first) sb.append(",");
                sb.append(convertToJson(item));
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }
        return "{}";
    }

    // Simple District model class
    private static class District {
        private int districtId;
        private String districtName;
        private int seatCount;
        private int provinceId;

        public District(int districtId, String districtName, int seatCount, int provinceId) {
            this.districtId = districtId;
            this.districtName = districtName;
            this.seatCount = seatCount;
            this.provinceId = provinceId;
        }

        public int getDistrictId() { return districtId; }
        public String getDistrictName() { return districtName; }
        public int getSeatCount() { return seatCount; }
        public int getProvinceId() { return provinceId; }
    }
}