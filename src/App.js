import React, { useState, useEffect } from 'react';
import { fetchLeagueData } from './services/fplService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

function App() {
  const [leagueData, setLeagueData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamColors, setTeamColors] = useState({});
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [selectedGameweekData, setSelectedGameweekData] = useState(null);

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
            standings: response.current.standings
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

  const GameweekPanel = ({ gameweekData, gameweekNumber }) => {
    if (!gameweekData) return null;
    
    return (
      <div style={{ 
        position: 'fixed',
        right: '20px',
        top: '100px',
        width: '280px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ccc',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          paddingBottom: '10px',
          marginBottom: '10px',
          borderBottom: '2px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h4 style={{ margin: 0 }}>Gameweek {gameweekNumber}</h4>
          <button 
            onClick={() => setSelectedGameweekData(null)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>
        {Object.entries(gameweekData)
          .filter(([key]) => key !== 'gameweek')
          .sort(([,a], [,b]) => a - b)
          .map(([teamName, position]) => {
            const teamStats = leagueData.standings.results.find(
              team => team.entry_name === teamName
            );
            
            return (
              <div 
                key={teamName}
                style={{ 
                  padding: '10px',
                  marginBottom: '10px',
                  borderLeft: `4px solid ${teamColors[teamName]}`,
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold',
                  color: teamColors[teamName],
                  marginBottom: '4px'
                }}>
                  {teamName}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <div>Position: {position}
                    {position === 1 ? 'st' : 
                      position === 2 ? 'nd' : 
                      position === 3 ? 'rd' : 'th'}
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
  };

  return (
    <div 
      style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedGameweekData(null);
        }
      }}
    >
      <h1>Dingle Fantasy Premier League</h1>
      <div>
        <h2>League: {leagueData.leagueName}</h2>
        
        {/* Current Standings Table */}
        <div style={{ marginBottom: '40px' }}>
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
              {leagueData.standings.results.map((team) => (
                <tr key={team.entry}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {team.rank}
                  </td>
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
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                    {team.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* League Graph */}
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h3>League Positions Over Time</h3>
          <div style={{ position: 'relative' }}>
            <LineChart
              width={1200}
              height={700}
              data={graphData}
              margin={{
                top: 20,
                right: 300,
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
                domain={[1, leagueData.standings.results.length]}
                ticks={Array.from({ length: leagueData.standings.results.length }, (_, i) => i + 1)}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: '20px',
                  bottom: -80
                }}
              />
              {leagueData.standings.results.map((team) => (
                <Line
                  key={team.entry_name}
                  type="monotone"
                  dataKey={team.entry_name}
                  name={team.entry_name}
                  stroke={teamColors[team.entry_name]}
                  dot={{ 
                    fill: teamColors[team.entry_name],
                    r: 4,
                    cursor: 'pointer'
                  }}
                  activeDot={{ 
                    r: 8,
                    cursor: 'pointer',
                    onClick: (props) => {
                      const { payload } = props;
                      if (payload) {
                        setSelectedGameweekData(payload);
                      }
                    }
                  }}
                  onClick={(data) => {
                    if (data && data.payload) {
                      setSelectedGameweekData(data.payload);
                    }
                  }}
                  cursor="pointer"
                  opacity={selectedTeams.size === 0 || selectedTeams.has(team.entry_name) ? 1 : 0.1}
                />
              ))}
            </LineChart>
            <GameweekPanel 
              gameweekData={selectedGameweekData} 
              gameweekNumber={selectedGameweekData?.gameweek}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;