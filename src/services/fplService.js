import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const fetchLeagueData = async (leagueId, teamId) => {
  try {
    // First, fetch league standings
    const leagueResponse = await axios.get(`${PROXY_URL}${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/`);
    
    // Wait briefly before continuing
    await delay(1000);

    const teams = leagueResponse.data.standings.results;
    const teamsHistory = [];

    // Fetch team histories with longer delays and retry logic
    for (const team of teams) {
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < 3) {
        try {
          await delay(2000); // Wait 2 seconds between each request
          const historyResponse = await axios.get(
            `${PROXY_URL}${FPL_BASE_URL}/entry/${team.entry}/history/`
          );
          
          teamsHistory.push({
            entry_name: team.entry_name,
            history: historyResponse.data.current
          });
          
          console.log(`Successfully fetched history for ${team.entry_name}`);
          success = true;
        } catch (error) {
          retryCount++;
          console.log(`Attempt ${retryCount} failed for ${team.entry_name}`);
          await delay(3000 * retryCount); // Increase delay with each retry
        }
      }
    }

    return {
      current: leagueResponse.data,
      teamsHistory
    };
  } catch (error) {
    console.error('Error fetching league data:', error);
    throw new Error(`Failed to fetch league data: ${error.message}`);
  }
};