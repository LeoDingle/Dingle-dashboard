import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fetchLeagueData } from './services/fplService';

function App() {
  const [leagueData, setLeagueData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamColors, setTeamColors] = useState({});
  const [selectedTeams, setSelectedTeams] = useState(new Set());

  const leagueId = '862023';
  const teamId = '793479';

  // Updated to generate neon colors
  const getRandomColor = () => {
    const neonColors = [
      '#00ff00', // Neon green
      '#ff00ff', // Neon pink
      '#00ffff', // Neon cyan
      '#ff0099', // Neon rose
      '#ff3300', // Neon orange
      '#ffff00', // Neon yellow
      '#ff66ff', // Neon magenta
      '#33ccff', // Neon blue
      '#99ff33', // Neon lime
      '#ff3399', // Neon hot pink
      '#00ff99', // Neon turquoise
      '#9933ff'  // Neon purple
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
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
    const loadData = async () => {
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

            setGraphData(graphPoints);
          }
        } else {
          throw new Error('Invalid data structure from API.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load league data. Please try again later.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#1a2637',
          padding: '15px',
          border: '1px solid #2a3747',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          position: 'fixed',
          left: '1050px',
          top: '100px',
          minWidth: '250px',
          maxWidth: '300px',
          maxHeight: '80vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1000,
          color: 'white'
        }}>
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#1a2637',
            padding: '5px 0',
            borderBottom: '2px solid #2a3747',
            marginBottom: '10px',
            zIndex: 1001
          }}>
            <h4 style={{ margin: 0, color: 'white' }}>
              Gameweek {label}
            </h4>
          </div>
          {payload
            .sort((a, b) => a.value - b.value)
            .map((entry) => {
              const teamStats = leagueData.standings.find(
                team => team.entry_name === entry.name
              );
              
              return (
                <div 
                  key={entry.name} 
                  style={{ 
                    padding: '8px',
                    marginBottom: '8px',
                    borderLeft: `4px solid ${entry.color}`,
                    backgroundColor: '#2a3747'
                  }}
                >
                  <div style={{ 
                    fontWeight: 'bold',
                    color: entry.color,
                    marginBottom: '4px'
                  }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffffff' }}>
                    <div>Position: {entry.value}
                      {entry.value === 1 ? 'st' : 
                        entry.value === 2 ? 'nd' : 
                        entry.value === 3 ? 'rd' : 'th'}
                    </div>
                    <div>Total Points: {teamStats?.total || 'N/A'}</div>
                    <div>GW Points: {teamStats?.event_total || 'N/A'}</div>
                    <div>Transfer Cost: {teamStats?.event_transfers_cost || 0}</div>
                  </div>
                </div>
              );
            })}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div style={{ color: 'white' }}>Loading...</div>;
  if (error) return <div style={{ color: 'white' }}>Error: {error}</div>;
  if (!leagueData) return <div style={{ color: 'white' }}>No data available</div>;

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: '#0a1929',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>FPL Dashboard</h1>
      <div>
        <h2>League: {leagueData.leagueName}</h2>
        
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h3>League Positions Over Time</h3>
          <LineChart
            width={1000}
            height={500}
            data={graphData}
            margin={{
              top: 20,
              right: 300,
              left: 20,
              bottom: 100
            }}
            style={{
              backgroundColor: '#1a2637',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3747" />
            <XAxis 
              dataKey="gameweek"
              label={{ value: 'Gameweek', position: 'bottom', fill: 'white' }}
              stroke="white"
            />
            <YAxis 
              reversed 
              label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: 'white' }}
              domain={[1, leagueData.standings.length]}
              ticks={Array.from({ length: leagueData.standings.length }, (_, i) => i + 1)}
              stroke="white"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: '20px',
                bottom: -80,
                color: 'white'
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
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </div>

        <div>
          <h3>Current Standings</h3>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: '#1a2637',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #2a3747', color: 'white' }}>Position</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #2a3747', color: 'white' }}>Team</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #2a3747', color: 'white' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {leagueData.standings.map((team) => (
                <tr key={team.entry}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #2a3747', color: 'white' }}>{team.rank}</td>
                  <td 
                    onClick={() => toggleTeamSelection(team.entry_name)}
                    style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid #2a3747',
                      color: teamColors[team.entry_name],
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      opacity: selectedTeams.size === 0 || selectedTeams.has(team.entry_name) ? 1 : 0.3
                    }}
                  >
                    {team.entry_name}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #2a3747', color: 'white' }}>{team.total}</td>
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