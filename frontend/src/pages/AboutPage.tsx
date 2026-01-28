import React from 'react';
import { ExternalLink, BatteryWarning as GoverningBoard, BarChart, PieChart, Users } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          About Sri Lankan Elections
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-10">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Sri Lanka's Local Government Electoral System
            </h2>
            
            <p className="mb-4 text-gray-700 leading-relaxed text-justify">
              Local government elections in Sri Lanka play a vital role in upholding democratic governance at the regional level. 
              Conducted every five years as required by law, these elections determine the representatives for municipal councils,
              urban councils, and pradeshiya sabhas (divisional councils) across the nation.
            </p>
            
            <p className="mb-6 text-gray-700 leading-relaxed text-justify">
              The electoral framework is a mixed system that combines proportional representation with a bonus seat allocation method. 
              This approach ensures both fair representation of parties and stable administrative control within local authorities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4 justify-center">
                  <GoverningBoard className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Governing Structure
                  </h3>
                </div>
                <p className="text-gray-700 text-justify">
                  Sri Lanka is organized into 9 provinces and 25 districts, each overseen by its own set of local government institutions. 
                  The local governance framework operates on a three-tier system: municipal councils serve major urban centers, urban councils
                  manage smaller towns, and pradeshiya sabhas are responsible for governance in rural regions.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4 justify-center">
                  <BarChart className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Seat Allocation
                  </h3>
                </div>
                <p className="text-gray-700 text-justify">
                  Seat distribution is carried out in three stages. Initially, seats are allocated proportionally according to the number of valid 
                  votes each party receives. Next, a bonus seat is granted to the party that secures the highest number of votes. Lastly, any remaining 
                  seats are assigned based on the largest remainders from the initial proportional allocation.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Political Landscape
            </h2>
            
            <p className="mb-4 text-gray-700 leading-relaxed text-justify">
              Sri Lanka's political environment is characterized by a rich diversity of parties reflecting a wide range of ideological, ethnic, and regional 
              perspectives. Historically, the United National Party (UNP) and the Sri Lanka Freedom Party (SLFP) have been the most influential, although political 
              alliances and coalitions are a frequent feature of the system.
            </p>
            
            <p className="mb-6 text-gray-700 leading-relaxed text-justify">
              Several regional and ethnic-based parties also play a key role. The Tamil National Alliance (TNA) and Ilankai Tamil Arasu Kadchi (ITAK) primarily 
              represent Tamil interests in the Northern and Eastern provinces, while parties such as the Muslim National Alliance (MNA) advocate for the Muslim 
              population across the country.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4 justify-center">
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Voter Participation
                  </h3>
                </div>
                <p className="text-gray-700 text-justify">
                  Sri Lanka typically sees high voter turnout in elections, reflecting 
                  the strong democratic tradition in the country. The Election Commission 
                  of Sri Lanka oversees the electoral process, ensuring fair and transparent 
                  elections throughout the country.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4 justify-center">
                  <PieChart className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Electoral Reform
                  </h3>
                </div>
                <p className="text-gray-700 text-justify">
                  Over the years, Sri Lanka has implemented various reforms to improve its electoral system. 
                  Among the most significant is the introduction of a quota system designed to boost women's 
                  participation in local governance. These changes reflect an ongoing commitment to building 
                  a more inclusive, equitable, and representative democratic process.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Official Resources
            </h2>
            
            <p className="mb-4 text-gray-700 leading-relaxed text-justify">
              For official information on Sri Lankan elections, including past results, electoral 
              regulations, and upcoming elections, please visit the Election Commission of Sri Lanka's 
              official website.
            </p>
            
            <div className="text-center">
              <a 
                href="https://elections.gov.lk/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                Visit the Election Commission of Sri Lanka
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
              <p>
                This website is for educational and informational purposes only. 
                While we strive for accuracy, the official Election Commission website 
                should be consulted for authoritative information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;