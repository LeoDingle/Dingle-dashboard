import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchLeagueData } from '../services/fplService';

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: 'white'
  }}>
    <div className="spinner" style={{
      border: '4px solid #1a2637',
      borderTop: '4px solid #00ff00',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: 'white',
    backgroundColor: '#0a1929',
    padding: '20px',
    textAlign: 'center'
  }}>
    <div style={{
      backgroundColor: '#1a2637',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #ff3333',
      maxWidth: '400px'
    }}>
      <h2 style={{ color: '#ff3333', marginTop: 0 }}>Oops! Something went wrong</h2>
      <p style={{ marginBottom: '20px' }}>{message}</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#2a3747',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={e => e.target.style.backgroundColor = '#3a4757'}
        onMouseOut={e => e.target.style.backgroundColor = '#2a3747'}
      >
        Try Again
      </button>
    </div>
  </div>
);

function App() {
  const [leagueData, setLeagueData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamColors, setTeamColors] = useState({});
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [showFormInfo, setShowFormInfo] = useState(false);
  const [graphView, setGraphView] = useState('position'); // 'position' or 'points'
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

   // Add window size detection
   useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        const leagueId = '862023';
        const teamId = '793479';
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
              
              // Get all teams' points for this gameweek
              const teamsInGameweek = response.teamsHistory.map(team => {
                const gwData = team.history.find(h => h.event === gameweek);
                return {
                  name: team.entry_name,
                  points: gwData ? gwData.total_points : 0,
                  event_points: gwData ? gwData.points : 0
                };
              });
          
              // Sort teams by points to determine mini-league position
              teamsInGameweek.sort((a, b) => b.points - a.points);
              
              // Assign positions and add to data point
              teamsInGameweek.forEach((team, index) => {
                point[`${team.name}_position`] = index + 1;
                point[`${team.name}_points`] = team.points;
                point[`${team.name}_event_points`] = team.event_points;
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
          position: 'absolute',
          right: isMobile ? '10px' : '20px',
          top: isMobile ? '10px' : '100px',
          Width: isMobile ?  'calc(100% - 40px' : '250px',
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
            .sort((a, b) => graphView === 'position' ? 
              a.value - b.value : 
              b.value - a.value)
            .map((entry) => {
              const teamName = entry.name.replace(`_${graphView}`, '');
              const teamStats = leagueData.standings.find(
                team => team.entry_name === teamName
              );
              
              return (
                <div 
                  key={teamName} 
                  style={{ 
                    padding: '8px',
                    marginBottom: '8px',
                    borderLeft: `4px solid ${teamColors[teamName]}`,
                    backgroundColor: '#2a3747'
                  }}
                >
                  <div style={{ 
                    fontWeight: 'bold',
                    color: teamColors[teamName],
                    marginBottom: '4px'
                  }}>
                    {teamName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffffff' }}>
                    <div>
                      {graphView === 'position' ? 
                        `Position: ${entry.value}${
                          entry.value === 1 ? 'st' : 
                          entry.value === 2 ? 'nd' : 
                          entry.value === 3 ? 'rd' : 'th'
                        }` :
                        `Points: ${entry.value}`
                      }
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!leagueData) return <div style={{ color: 'white' }}>No data available</div>;
  if (!isClient) return null;

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px', 
      maxWidth: '100%', 
      margin: '0 auto',
      backgroundColor: '#0a1929',
      minHeight: '100vh',
      color: 'white',
      overflow: 'hidden' // Prevent horizontal scroll
    }}>
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '0.5rem' : '1rem'
      }}>
      Dingle Fantasy Premier League
      </h1>

      <div>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.5rem' }}>
          League: {leagueData.leagueName}
          </h2>
        
        <div style={{
           marginTop: isMobile ? '10px' : '20px',
           marginBottom: isMobile ? '10px' : '20px'
            }}>
  <div style={{ 
    display: 'flex', 
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center', 
    gap: '10px',
    marginBottom: '20px' 
  }}>
    <h3 style={{margin: 0 }}>
      League {graphView === 'position' ? 'Positions' : 'Points'} Over Time
      </h3>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#2a3747',
      padding: '5px',
      borderRadius: '20px',
      width: isMobile ? '100%' : 'auto',
      justifyContent: isMobile ? 'space-between' : 'flex-start'
    }}>
      <button
        onClick={() => setGraphView('position')}
        style={{
          padding: '8px 16px',
          borderRadius: '15px',
          border: 'none',
          background: graphView === 'position' ? '#00ff00' : 'transparent',
          color: graphView === 'position' ? '#000' : '#fff',
          cursor: 'pointer'
        }}
      >
        Position
      </button>
      <button
        onClick={() => setGraphView('points')}
        style={{
          padding: '8px 16px',
          borderRadius: '15px',
          border: 'none',
          background: graphView === 'points' ? '#00ff00' : 'transparent',
          color: graphView === 'points' ? '#000' : '#fff',
          cursor: 'pointer'
        }}
      >
        Points
      </button>
    </div>
  </div>
  <div style={{ 
    width: '100%', 
    height: isMobile ? '300px' : '500px',
    backgroundColor: '#1a2637',
    borderRadius: '8px',
    padding: isMobile ? '10px' : '20px'
  }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={graphData}
        margin={{
          top: 20,
          right: isMobile ? 20 : 300,
          left: 20,
          bottom: isMobile ? 60 : 100
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3747" />
        <XAxis 
          dataKey="gameweek"
          label={{ 
            value: 'Gameweek', 
            position: 'bottom', 
            fill: 'white',
            offset: isMobile ? -5 : 0
          }}
          stroke="white"
          tick={{ fontSize: isMobile ? 10 : 12 }}
        />
        <YAxis 
          reversed={graphView === 'position'}
          label={{ 
            value: graphView === 'position' ? 'Position' : 'Points', 
            angle: -90, 
            position: 'insideLeft', 
            fill: 'white' 
          }}
          domain={graphView === 'position' ? [1, leagueData.standings.length] : ['auto', 'auto']}
          ticks={graphView === 'position' ? 
            Array.from({ length: leagueData.standings.length }, (_, i) => i + 1) : 
            undefined}
          stroke="white"
          tick={{ fontSize: isMobile ? 10 : 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout={isMobile ? 'horizontal' : 'vertical'}
          verticalAlign={isMobile ? 'bottom' : 'middle'}
          align={isMobile ? 'center' : 'right'}
          wrapperStyle={{
            paddingTop: isMobile ? '10px' : '20px',
            right: isMobile ? 0 : 20,
            bottom: isMobile ? -50 : 'auto',
            fontSize: isMobile ? 10 : 12
          }}
        />
  {leagueData.standings.map((team) => (
    <Line
      key={team.entry_name}
      type="monotone"
      dataKey={`${team.entry_name}_${graphView}`}
      name={team.entry_name}
      stroke={teamColors[team.entry_name]}
      dot={{ r:2, fill: teamColors[team.entry_name] }}
      activeDot={{ r: 8 }}
      opacity={selectedTeams.size === 0 || selectedTeams.has(team.entry_name) ? 1 : 0.1}
      strokeWidth={2}
    />
  ))}
</LineChart>
</ResponsiveContainer>
         </div>
        </div>

        <div>
          <h3 style={{fontSize: isMobile ? '1.1rem' : '1.25rem' }}>Current Standings</h3>
          <div style={{ 
            overflowX: 'auto',
            marginBottom: '10px',
            WebkitOverflowScrolling: 'touch' 
          }}>
            <span style={{ fontWeight: 'bold' }}>Form Guide</span>
            <div 
              style={{ 
                position: 'relative',
                display: 'inline-block',
                cursor: 'help'
              }}
              onMouseEnter={() => setShowFormInfo(true)}
              onMouseLeave={() => setShowFormInfo(false)}
            >
              <span style={{ 
                backgroundColor: '#1a2637',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #2a3747'
              }}>
                i
              </span>
              {showFormInfo && (
                <div style={{
                  position: 'absolute',
                  left: '30px',
                  top: '0',
                  backgroundColor: '#1a2637',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #2a3747',
                  zIndex: 1000,
                  width: '200px',
                  color: 'white'
                }}>
                  <div style={{ marginBottom: '10px' }}>Last 5 gameweeks performance:</div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: '#00ff00',
                      display: 'inline-block',
                      marginRight: '8px'
                    }}></span>
                    Above gameweek average
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: '#666',
                      display: 'inline-block',
                      marginRight: '8px'
                    }}></span>
                    Equal to gameweek average
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: '#ff0000',
                      display: 'inline-block',
                      marginRight: '8px'
                    }}></span>
                    Below gameweek average
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <th style={{padding: '12px', borderBottom: '2px solid #2a3747', color: 'white' }}>Form</th>
              </tr>
            </thead>
            <tbody>
            {leagueData.standings.map((team) => {
    
    // Calculate form based on last 5 gameweeks
    const lastFiveWeeks = graphData.slice(-5);
    const formDots = lastFiveWeeks.map((week, index) => {
      // Calculate average points for this gameweek
      const allPoints = leagueData.standings.map(t => t.event_total || 0);
      const avgPoints = allPoints.reduce((a, b) => a + b, 0) / allPoints.length;
      
      const teamPoints = team.event_total || 0;
      
      let color = '#666'; // equal
      if (teamPoints > avgPoints) color = '#00ff00'; // above average
      if (teamPoints < avgPoints) color = '#ff0000'; // below average
                  
      return (
        <span
          key={week.gameweek}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
            marginRight: '4px'
          }}
          title={`GW${week.gameweek}: ${teamPoints}pts (Avg: ${avgPoints.toFixed(1)})`}
        />
      );
    });

    return (
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
        <td style={{ padding: '12px', borderBottom: '1px solid #2a3747', color: 'white' }}>
          {formDots || 'Loading form data...'}
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;