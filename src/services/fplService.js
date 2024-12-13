import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

// Helper function to add delay between requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const fetchLeagueData = async (leagueId) => {
  try {
    // Get league standings first
    const leagueResponse = await axios.get(`${PROXY_URL}${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/`);
    
    const teams = leagueResponse.data.standings.results;
    const teamsHistory = [];

    // Fetch history for each team sequentially with delays
    for (const team of teams) {
      await delay(1000); // Wait 1 second between requests
      try {
        const historyResponse = await axios.get(
          `${PROXY_URL}${FPL_BASE_URL}/entry/${team.entry}/history/`
        );
        teamsHistory.push({
          entry_name: team.entry_name,
          history: historyResponse.data.current
        });
        console.log(`Successfully fetched history for ${team.entry_name}`);
      } catch (error) {
        console.error(`Failed to fetch history for ${team.entry_name}:`, error);
      }
    }

    return {
      current: leagueResponse.data,
      teamsHistory
    };
  } catch (error) {
    console.error('Full error details:', error);
    throw new Error(`Failed to fetch league data: ${error.message}`);
  }
};