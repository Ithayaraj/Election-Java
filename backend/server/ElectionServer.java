package backend.server;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;

import backend.controller.DistrictElectionHandler;
import backend.controller.DistrictHandler;
import backend.controller.ProvinceController;
import backend.controller.ElectionHandler;
import backend.controller.PartyHandler;
import backend.controller.PartyVotesHandler;
import backend.controller.SeatAllocationHandler;

public class ElectionServer {
    public  void server() throws IOException {
        int port = 8080;
        // Create HTTP server on specified port
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Register API handlers
        // ElectionServer.java
        server.createContext("/province", new ProvinceController());
        server.createContext("/districts", new DistrictHandler());
        server.createContext("/election", new ElectionHandler());
        server.createContext("/party", new PartyHandler());
        server.createContext("/parties_votes", new PartyVotesHandler());
        server.createContext("/seat_allocation", new SeatAllocationHandler());
        server.createContext("/dist_election", new DistrictElectionHandler());


        server.setExecutor(null); // Default executor
        server.start();
        System.out.println("✅ Election Server started on port " + port);
    }
}
