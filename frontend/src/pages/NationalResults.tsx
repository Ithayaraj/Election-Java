import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Add mock data for partyResults
const partyResults = [
    { name: 'Party A', seats: 120, color: '#0088FE' },
    { name: 'Party B', seats: 80, color: '#00C49F' },
    { name: 'Party C', seats: 60, color: '#FFBB28' },
    { name: 'Party D', seats: 40, color: '#FF8042' },
];

<div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-2xl mb-8 -mt-4">
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={partyResults}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={180}
                                    fill="#8884d8"
                                    dataKey="seats"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                >
                                    {partyResults.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>