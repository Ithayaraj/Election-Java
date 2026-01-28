package backend.models;

public class User {
    private String username;
    private String password;
    private String role; // "admin" or "user"

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    // Getters and setters
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
} 