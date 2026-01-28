package backend;

import backend.models.KeyValue;
import backend.services.ElectionService;
import backend.db.DatabaseConnector;
import backend.server.ElectionServer;
import java.io.IOException;

import java.sql.*;
import java.util.*;

public class ElectionApp {
    public static void main(String[] args) {
        // Server start here
        ElectionServer server = new ElectionServer();
        try {
            server.server();
        } catch (IOException e) {
            System.err.println("❌ Error starting server: " + e.getMessage());
            return;
        }
        Scanner scanner = new Scanner(System.in);
        Map<String, List<KeyValue>> provinceDistrictMap = new LinkedHashMap<>();

        // Load provinces and districts from DB
        try (Connection conn = DatabaseConnector.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("""
                 SELECT p.province_name, d.district_name, d.seat_count
                 FROM province p
                 JOIN district d ON p.province_id = d.province_id
             """)) {

            while (rs.next()) {
                String provinceName = rs.getString("province_name").toLowerCase();
                String districtName = rs.getString("district_name");
                int seatCount = rs.getInt("seat_count");

                provinceDistrictMap.putIfAbsent(provinceName, new ArrayList<>());
                provinceDistrictMap.get(provinceName).add(new KeyValue(districtName, seatCount));
            }
        } catch (SQLException e) {
            System.err.println("❌ Error loading provinces and districts from DB: " + e.getMessage());
            scanner.close();
            return;
        }

        if (provinceDistrictMap.isEmpty()) {
            System.out.println("⚠️ No provinces found in the database.");
            scanner.close();
            return;
        }

        // Display provinces
        System.out.println("Available Provinces:");
        int idx = 1;
        List<String> provinceList = new ArrayList<>(provinceDistrictMap.keySet());
        for (String province : provinceList) {
            System.out.println(idx++ + ". " + province);
        }

        // Select province *******************************************************
        String selectedProvince = null;
        while (selectedProvince == null) {
            System.out.print("Select a province by name or number: ");
            String input = scanner.nextLine().trim().toLowerCase();

            try {
                int number = Integer.parseInt(input);
                if (number >= 1 && number <= provinceList.size()) {
                    selectedProvince = provinceList.get(number - 1);
                }
            } catch (NumberFormatException e) {
                for (String province : provinceList) {
                    if (province.equalsIgnoreCase(input)) {
                        selectedProvince = province;
                        break;
                    }
                }
            }

            if (selectedProvince == null) {
                System.out.println("Invalid input. Try again.");
            }
        }

        System.out.println("\nDistricts in " + selectedProvince + ":");
        idx = 1;
        List<KeyValue> districts = provinceDistrictMap.get(selectedProvince);
        for (KeyValue district : districts) {
            System.out.println(idx++ + ". " + district.key + " (" + district.value + " seats)");
        }

        // Select district *******************************************************
        String selectedDistrict = null;
        int totalSeatCount = 0;
        while (selectedDistrict == null) {
            System.out.print("Select a district by name or number: ");
            String input = scanner.nextLine().trim();

            try {
                int number = Integer.parseInt(input);
                if (number >= 1 && number <= districts.size()) {
                    selectedDistrict = districts.get(number - 1).key;
                    totalSeatCount = districts.get(number - 1).value;
                }
            } catch (NumberFormatException e) {
                for (KeyValue district : districts) {
                    if (district.key.equalsIgnoreCase(input)) {
                        selectedDistrict = district.key;
                        totalSeatCount = district.value;
                        break;
                    }
                }
            }

            if (selectedDistrict == null) {
                System.out.println("Invalid input. Try again.");
            }
        }

        // Election year
        System.out.print("Enter election year: ");
        int year = Integer.parseInt(scanner.nextLine());

        // Election calculations
        System.out.print("Enter number of political parties: ");
        int partyCount = Integer.parseInt(scanner.nextLine());

        KeyValue[] politicalParty = new KeyValue[partyCount];
        int[] validVotesPerParty = new int[partyCount];

        for (int i = 0; i < partyCount; i++) {
            System.out.print("Enter Party Name " + (i + 1) + ": ");
            politicalParty[i] = new KeyValue(scanner.nextLine(), 0);
        }
        // System.out.println("Enter total votes");
        // int totalVotes = Integer.parseInt(scanner.nextLine());
        System.out.print("Enter total valid votes: ");
        int totalValidVotes = Integer.parseInt(scanner.nextLine());
        // int rectedVotes = totalVotes - totalValidVotes;

        // int totalVotes = totalValidVotes; // If you want to ask for total votes (including invalid), add that input
        // int totalInvalidVotes = 0; // If you want to calculate invalid votes, add that logic

        for (int i = 0; i < partyCount; i++) {
            System.out.print(politicalParty[i].key + " total valid votes: ");
            validVotesPerParty[i] = Integer.parseInt(scanner.nextLine());
        }

        // Disqualification calculations
        int disqualifyPartyCount = 0;
        int disqualifyVotes = 0;
        int disqualifyThreshold = Math.round(totalValidVotes * 0.05f);
        System.out.println("\nDisqualification Threshold: " + disqualifyThreshold + " votes (5% of total valid votes)");

        for (int i = 0; i < partyCount; i++) {
            if (validVotesPerParty[i] < disqualifyThreshold) {
                disqualifyPartyCount++;
                disqualifyVotes += validVotesPerParty[i];
            }
        }
        System.out.println("Disqualified Votes: " + disqualifyVotes);
        int qualifyVotes = totalValidVotes - disqualifyVotes;
        System.out.println("Qualified Votes: " + qualifyVotes);
        int votesPerSeat = qualifyVotes / totalSeatCount;
        System.out.println("Total Votes per Seat: " + votesPerSeat);

        // Bonus Round Allocation
        System.out.println("\nBonus Seat Allocation:");
        int maxVotesIndex = 0;
         int[] bonusRoundSeats = new int[partyCount];
        for (int i = 1; i < partyCount; i++) {
            if (validVotesPerParty[i] > validVotesPerParty[maxVotesIndex]) {
                maxVotesIndex = i;
            }

        }
        for (int i = 1; i < partyCount; i++) {
            if (validVotesPerParty[i] == validVotesPerParty[maxVotesIndex]) {
                bonusRoundSeats[i] = 1; // Assign bonus seat to all parties with max votes
            } else {
                bonusRoundSeats[i] = 0; // No bonus seat for others
            }
        }

        System.out.println(politicalParty[maxVotesIndex].key + " receives the bonus seat.");
        // String bonusround=politicalParty[maxVotesIndex].key;

        // First Round Seat Allocation
        System.out.println("\nFirst Seat Allocation:");
        int[] firstRoundSeats = new int[partyCount];
        for (int i = 0; i < partyCount; i++) {
            if (validVotesPerParty[i] >= disqualifyThreshold) {
                firstRoundSeats[i] = validVotesPerParty[i] / votesPerSeat;
            }
            System.out.println(politicalParty[i].key + " => " + firstRoundSeats[i] + " seats.");
        }
        

        // Second Round Seat Allocation
        System.out.println("\nSecond Seat Allocation:");
        int allocatedSeats = Arrays.stream(firstRoundSeats).sum();
        int remainingSeats = totalSeatCount - allocatedSeats - 1; // -1 for bonus seat

        int[] secondRoundSeats = new int[partyCount];
        if (remainingSeats > 0) {
            // Create list of qualified parties only
            List<Integer> qualifiedIndices = new ArrayList<>();
            for (int i = 0; i < partyCount; i++) {
                if (validVotesPerParty[i] >= disqualifyThreshold) {
                    qualifiedIndices.add(i);
                }
            }

            // Sort by remainder votes (highest first)
            qualifiedIndices.sort((a, b) -> {
                int remainderA = validVotesPerParty[a] % votesPerSeat;
                int remainderB = validVotesPerParty[b] % votesPerSeat;
                return Integer.compare(remainderB, remainderA);
            });

            // Distribute remaining seats
            for (int i = 0; i < remainingSeats && i < qualifiedIndices.size(); i++) {
                int partyIndex = qualifiedIndices.get(i);
                secondRoundSeats[partyIndex]++;
            }
        }

        for (int i = 0; i < partyCount; i++) {
            System.out.println(politicalParty[i].key + " => " + secondRoundSeats[i] + " seats.");
        }

        // Final Seat Allocation
        System.out.println("\nFinal Seat Allocation:");
        int[] finalSeats = new int[partyCount];
        for (int i = 0; i < partyCount; i++) {
            finalSeats[i] = firstRoundSeats[i] + secondRoundSeats[i] + (i == maxVotesIndex ? 1 : 0);
            System.out.println(politicalParty[i].key + " => " + finalSeats[i] + " total seats.");
        }

        // Save results using ElectionService
        ElectionService electionService = new ElectionService();
        electionService.saveResults(
                selectedDistrict,
                totalSeatCount,
                year,
                politicalParty,
                finalSeats,
                validVotesPerParty,
                // totalVotes,
                totalValidVotes,
                // rectedVotes,
                disqualifyPartyCount,
                disqualifyVotes,
                disqualifyThreshold,
                bonusRoundSeats,
                firstRoundSeats,
                secondRoundSeats
                
        );

        System.out.println("✅ Election results saved successfully.");
        scanner.close();
    }
}