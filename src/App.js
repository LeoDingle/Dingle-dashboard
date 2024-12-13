import React, { useState, useEffect } from 'react';
import { fetchLeagueData } from './services/fplService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function App() {
  const [leagueData, setLeagueData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamColors, setTeamColors] = useState({});
  const [selectedTeams, setSelectedTeams] = useState(new Set());

  const leagueId = '862023';
  const teamId = '793479';

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const toggleTeamSelection = (teamName) => {
    setSelectedTeams(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(teamName)) {
        newSelected.delete(teamName);
      } else {
        newSelected.add(teamName);
      }
      return newSelected;
    });
  };

  useEffect(() => {
    const loadLeagueData = async () => {
      try {
        const response = await fetchLeagueData(leagueId, teamId);

        if (response?.current?.standings?.results) {
          const standings = response.current.standings.results;

          setLeagueData({
            leagueName: response.current.league?.name || 'Unknown League',
            standings,
          });

          const colors = standings.reduce((acc, team) => {
            acc[team.entry_name] = getRandomColor();
            return acc;
          }, {});
          setTeamColors(colors);

          if (response.teamsHistory) {
            const maxGameweek = Math.max(
              ...response.teamsHistory[0].history.map(gw => gw.event)
            );

            const graphPoints = Array.from({ length: maxGameweek }, (_, index) => {
              const gameweek = index + 1;
              const point = { gameweek };
              
              const gameweekData = response.teamsHistory.map(team => {
                const gwData = team.history.find(h => h.event === gameweek);
                return {
                  entry_name: team.entry_name,
                  total_points: gwData ? gwData.total_points : 0
                };
              });

              gameweekData.sort((a, b) => b.total_points - a.total_points);

              gameweekData.forEach((teamData, index) => {
                point[teamData.entry_name] = index + 1;
              });
              
              return point;
            });

            console.log('Processed graph points:', graphPoints);
            setGraphData(graphPoints);
          }
        } else {
          throw new Error('Invalid data structure from API.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching league data:', err);
        setError('Failed to load league data. Please try again later.');
        setLoading(false);
      }
    };

    loadLeagueData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!leagueData) return <div>No data available</div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{`Gameweek ${label}`}</p>
          {payload
            .sort((a, b) => a.value - b.value)
            .map((entry) => (
              <p key={entry.name} style={{ 
                color: entry.color,
                margin: '3px 0',
                fontSize: '14px'
              }}>
                {`${entry.name}: ${entry.value}${entry.value === 1 ? 'st' : entry.value === 2 ? 'nd' : entry.value === 3 ? 'rd' : 'th'}`}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>FPL Dashboard</h1>
      <div>
        <h2>League: {leagueData.leagueName}</h2>
        
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h3>League Positions Over Time</h3>
          <LineChart
            width={800}
            height={400}
            data={graphData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 100
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="gameweek"
              label={{ value: 'Gameweek', position: 'bottom' }}
            />
            <YAxis 
              reversed 
              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              domain={[1, leagueData.standings.length]}
              ticks={Array.from({ length: leagueData.standings.length }, (_, i) => i + 1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: '20px',
                bottom: -80
              }}
            />
            {leagueData.standings.map((team) => (
              <Line
                key={team.entry_name}
                type="monotone"
                dataKey={team.entry_name}
                name={team.entry_name}
                stroke={teamColors[team.entry_name]}
                dot={{ fill: teamColors[team.entry_name] }}
                activeDot={{ r: 8 }}
                opacity={selectedTeams.size === 0 || selectedTeams.has(team.entry_name) ? 1 : 0.1}
              />
            ))}
          </LineChart>
        </div>

        <div>
          <h3>Current Standings</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Position</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Team</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {leagueData.standings.map((team) => (
                <tr key={team.entry}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{team.rank}</td>
                  <td 
                    onClick={() => toggleTeamSelection(team.entry_name)}
                    style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid #ddd',
                      color: teamColors[team.entry_name],
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      opacity: selectedTeams.size === 0 || selectedTeams.has(team.entry_name) ? 1 : 0.3
                    }}
                  >
                    {team.entry_name}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{team.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;