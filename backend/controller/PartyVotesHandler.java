package backend.controller;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import backend.db.DatabaseConnector;

import java.io.IOException;
// import java.io.InputStreamReader;
import java.io.OutputStream;
// import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
// import org.json.JSONObject;

public class PartyVotesHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        switch (method) {
            case "GET":
                if (path.matches(".*/total_votes/[^/]+$")) {
                    totalVotesPartyDistrict(exchange, path);
                } else {
                    getPartyVotes(exchange);
                }
                break;
            case "POST":
                createPartyVotes(exchange);
                break;
            default:
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
                break;
        }
    }

    private void getPartyVotes(HttpExchange exchange) throws IOException {
        StringBuilder response = new StringBuilder();
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT pv.party_votes_id, p.party_name, pv.votes, de.district_election_id " +
                     "FROM party_votes pv " +
                     "JOIN party p ON pv.party_id = p.party_id " +
                     "JOIN district_election de ON pv.district_election_id = de.district_election_id " +
                     "ORDER BY de.district_election_id, p.party_name");
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                response.append("PartyVotesID: ").append(rs.getInt("party_votes_id"))
                        .append(", Party: ").append(rs.getString("party_name"))
                        .append(", Votes: ").append(rs.getInt("votes"))
                        .append(", DistrictElectionID: ").append(rs.getInt("district_election_id"))
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

    private void createPartyVotes(HttpExchange exchange) throws IOException {
        // Expecting request body as: district_election_id=1&party_id=2&votes=1234
        String requestBody = new String(exchange.getRequestBody().readAllBytes()).trim();
        String[] params = requestBody.split("&");
        int districtElectionId = -1, partyId = -1, votes = -1;

        try {
            for (String param : params) {
                String[] pair = param.split("=");
                if (pair.length == 2) {
                    if ("district_election_id".equals(pair[0])) {
                        districtElectionId = Integer.parseInt(pair[1]);
                    } else if ("party_id".equals(pair[0])) {
                        partyId = Integer.parseInt(pair[1]);
                    } else if ("votes".equals(pair[0])) {
                        votes = Integer.parseInt(pair[1]);
                    }
                }
            }
            if (districtElectionId == -1 || partyId == -1 || votes == -1) {
                throw new IllegalArgumentException("Missing required parameters.");
            }
        } catch (Exception e) {
            String response = "❌ Invalid input: " + e.getMessage();
            exchange.sendResponseHeaders(400, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
            return;
        }

        String response;
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "INSERT INTO party_votes (votes, district_election_id, party_id) VALUES (?, ?, ?)",
                     PreparedStatement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, votes);
            stmt.setInt(2, districtElectionId);
            stmt.setInt(3, partyId);
            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        int partyVotesId = rs.getInt(1);
                        response = "Party votes created successfully with ID: " + partyVotesId;
                        exchange.sendResponseHeaders(201, response.length());
                    } else {
                        response = "Party votes created, but could not retrieve ID.";
                        exchange.sendResponseHeaders(201, response.length());
                    }
                }
            } else {
                response = "Failed to create party votes.";
                exchange.sendResponseHeaders(500, response.length());
            }
        } catch (Exception e) {
            response = "❌ Error: " + e.getMessage();
            exchange.sendResponseHeaders(500, response.length());
        }
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

    // Updated function to get total votes for a party in a district using JSON body
    private void totalVotesPartyDistrict(HttpExchange exchange, String path) throws IOException {
        // Extract party name from path: /parties_votes/total_votes/{party_name}
        String[] parts = path.split("/");
        String partyName = parts[parts.length - 1];
        String response;

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                 // Updated SQL to match your schema
                 "SELECT p.party_name, d.district_name, e.year, COALESCE(SUM(pv.votes),0) AS total_votes " +
                 "FROM party_votes pv " +
                 "JOIN district_election de ON pv.district_election_id = de.district_election_id " +
                 "JOIN party p ON pv.party_id = p.party_id " +
                 "JOIN district d ON de.district_id = d.district_id " +
                 "JOIN election e ON de.election_id = e.election_id " +
                 "WHERE p.party_name = ? " +
                 "GROUP BY p.party_name, d.district_name, e.year " +
                 "ORDER BY e.year, d.district_name"
             )) {
            stmt.setString(1, partyName);
            try (ResultSet rs = stmt.executeQuery()) {
                StringBuilder sb = new StringBuilder();
                sb.append("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    sb.append("{")
                        .append("\"party_name\":\"").append(rs.getString("party_name")).append("\",")
                        .append("\"district_name\":\"").append(rs.getString("district_name")).append("\",")
                        .append("\"year\":").append(rs.getInt("year")).append(",")
                        .append("\"total_votes\":").append(rs.getInt("total_votes"))
                        .append("}");
                    first = false;
                }
                sb.append("]");
                response = sb.toString();
            }
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length());
        } catch (Exception e) {
            response = "{\"error\": \"" + e.getMessage().replace("\"", "'") + "\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(500, response.length());
        }
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
}