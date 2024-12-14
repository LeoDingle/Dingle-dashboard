import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/'
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const fetchLeagueData = async (leagueId, teamId) => {
  for (const PROXY_URL of PROXIES) {
    try {
      console.log(`Attempting with proxy: ${PROXY_URL}`);
      
      // First, fetch league standings
      const leagueResponse = await axios.get(`${PROXY_URL}${encodeURIComponent(FPL_BASE_URL)}/leagues-classic/${leagueId}/standings/`, {
        headers: {
          'Origin': 'https://fantasy.premierleague.com',
          'Accept': 'application/json'
        }
      });
      
      await delay(1000);

      const teams = leagueResponse.data.standings.results;
      const teamsHistory = [];

      // Fetch team histories with longer delays and retry logic
      for (const team of teams) {
        try {
          await delay(2000); // Wait between requests
          const historyResponse = await axios.get(
            `${PROXY_URL}${encodeURIComponent(`${FPL_BASE_URL}/entry/${team.entry}/history/`)}`
          );
          
          teamsHistory.push({
            entry_name: team.entry_name,
            history: historyResponse.data.current
          });
          
          console.log(`Successfully fetched history for ${team.entry_name}`);
        } catch (error) {
          console.log(`Failed to fetch history for ${team.entry_name}:`, error.message);
        }
      }

      return {
        current: leagueResponse.data,
        teamsHistory
      };
    } catch (error) {
      console.error(`Failed with proxy ${PROXY_URL}:`, error.message);
      continue; // Try next proxy
    }
  }
  
  throw new Error('Failed to fetch data with all available proxies');
};