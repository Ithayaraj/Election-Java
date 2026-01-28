package backend.db;

import java.sql.*;

public class DatabaseConnector {
    private static final String DB_NAME = "electionsystem";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "root";

    // JDBC driver is loaded and database is created if it doesn't exist
    static {
        // But many developers still include Class.forName(...) for compatibility, clarity, and control.
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("❌ JDBC Driver not found.");
            e.printStackTrace();
        }

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {

            String createDbSQL = "CREATE DATABASE IF NOT EXISTS " + DB_NAME;
            stmt.executeUpdate(createDbSQL);
            System.out.println("✅ Database '" + DB_NAME + "' is ready.");
        } catch (SQLException e) {
            System.err.println("❌ Error creating database: " + e.getMessage());
        }

        String fullDbUrl = DB_URL + DB_NAME + "?allowMultiQueries=true";
        try (Connection conn = DriverManager.getConnection(fullDbUrl, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate("""
                CREATE TABLE IF NOT EXISTS province (
                    province_id INT PRIMARY KEY AUTO_INCREMENT,
                    province_name VARCHAR(100) UNIQUE NOT NULL
                );

                CREATE TABLE IF NOT EXISTS district (
                    district_id INT PRIMARY KEY AUTO_INCREMENT,
                    province_id INT,
                    district_name VARCHAR(100) UNIQUE NOT NULL,
                    seat_count INT NOT NULL,
                    FOREIGN KEY (province_id) REFERENCES province(province_id)
                );

                CREATE TABLE IF NOT EXISTS election (
                    election_id INT PRIMARY KEY AUTO_INCREMENT,
                    year INT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS district_election (
                    district_election_id INT PRIMARY KEY AUTO_INCREMENT,
                    total_valid_votes INT NOT NULL,
                    disqualify_votes INT NOT NULL,
                    disqualify_party_count INT NOT NULL,
                    threshold_5_percent INT NOT NULL,
                    district_id INT,
                    election_id INT,
                    FOREIGN KEY (district_id) REFERENCES district(district_id),
                    FOREIGN KEY (election_id) REFERENCES election(election_id)
                );

                CREATE TABLE IF NOT EXISTS party (
                    party_id INT PRIMARY KEY AUTO_INCREMENT,
                    party_name VARCHAR(100) UNIQUE NOT NULL
                );

                CREATE TABLE IF NOT EXISTS party_votes (
                    party_votes_id INT PRIMARY KEY AUTO_INCREMENT,
                    votes INT NOT NULL,
                    district_election_id INT,
                    party_id INT,
                    FOREIGN KEY (district_election_id) REFERENCES district_election(district_election_id),
                    FOREIGN KEY (party_id) REFERENCES party(party_id)
                );

                CREATE TABLE IF NOT EXISTS seat_allocation (
                    seat_allocation_id INT PRIMARY KEY AUTO_INCREMENT,
                    bonus_round INT DEFAULT 0,
                    first_round INT DEFAULT 0,
                    second_round INT DEFAULT 0,
                    final_allocation INT NOT NULL,
                    district_election_id INT,
                    party_id INT,
                    FOREIGN KEY (district_election_id) REFERENCES district_election(district_election_id),
                    FOREIGN KEY (party_id) REFERENCES party(party_id)
                );
            """);

            System.out.println("✅ Tables are updated and ready in '" + DB_NAME + "' DB.");
        } catch (SQLException e) {
            System.err.println("❌ Error creating tables: " + e.getMessage());
        }
    }

    public static void initializeDatabase() {
        String createUsersTable = """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL
            )
            """;
            
        String insertAdmin = """
            INSERT INTO users (username, password, role) 
            VALUES ('admin', 'admin123', 'admin')
            ON DUPLICATE KEY UPDATE role = 'admin'
            """;
            
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createUsersTable);
            stmt.execute(insertAdmin);
        } catch (SQLException e) {
            System.err.println("Database initialization error: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL + DB_NAME + "?allowMultiQueries=true", DB_USER, DB_PASSWORD);
    }
}