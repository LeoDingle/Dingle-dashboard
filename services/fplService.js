import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Adjust PROXY_URL based on environment
const PROXY_URL = '/api/proxy';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Remove localStorage functions since they don't work with SSR
const fetchWithProxy = async (url) => {
  console.log('Attempting to fetch:', url);
  
  try {
    const response = await axios.get(PROXY_URL, {
      params: {
        url: url
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Proxy fetch error:', error);
    throw error;
  }
};

export const fetchLeagueData = async (leagueId) => {
  try {
    console.log('Fetching league data for ID:', leagueId);
    const standingsUrl = `${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/`;
    const leagueData = await fetchWithProxy(standingsUrl);
    
    console.log('Successfully fetched league data:', leagueData);
    
    await delay(1000);

    const teams = leagueData.standings.results;
    const teamsHistory = [];

    for (const team of teams) {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await delay(2000);
          const historyUrl = `${FPL_BASE_URL}/entry/${team.entry}/history/`;
          const historyData = await fetchWithProxy(historyUrl);
          
          teamsHistory.push({
            entry_name: team.entry_name,
            history: historyData.current,
            form: historyData.current.slice(-5).map(gw => ({
              gameweek: gw.event,
              points: gw.points - gw.event_transfers_cost,
              goodPerformance: (gw.points - gw.event_transfers_cost) > 50
            }))
          });
          
          console.log(`Successfully fetched history for ${team.entry_name}`);
          break;
        } catch (error) {
          retryCount++;
          console.log(`Attempt ${retryCount} failed for ${team.entry_name}:`, error.message);
          if (retryCount < maxRetries) {
            await delay(5000 * retryCount);
          }
        }
      }
    }

    return {
      current: leagueData,
      teamsHistory
    };

  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
};