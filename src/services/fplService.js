import axios from 'axios';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Updated proxy URLs and added additional options
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getCachedData = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const { timestamp, data } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(key);
    return null;
  }
  return data;
};

const setCachedData = (key, data) => {
  const cacheObject = {
    timestamp: Date.now(),
    data
  };
  localStorage.setItem(key, JSON.stringify(cacheObject));
};

const fetchWithProxy = async (url) => {
  const fullUrl = `${PROXY_URL}${url}`;
  console.log('Attempting to fetch:', fullUrl);
  
  const response = await axios.get(fullUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  
  return response.data;
};

export const fetchLeagueData = async (leagueId, teamId) => {
  // Try to get cached data first
  const cacheKey = `fpl_data_${leagueId}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    console.log('Using cached data');
    return cachedData;
  }

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
          
          // Calculate form from last 5 gameweeks
          const current = historyData.current;
          const lastFiveGameweeks = current.slice(-5);
          const form = lastFiveGameweeks.map(gw => {
            const points = gw.points - gw.event_transfers_cost;
            return {
              gameweek: gw.event,
              points: points,
              goodPerformance: points > 50  // We'll consider above 50 as good
            };
          });

          teamsHistory.push({
            entry_name: team.entry_name,
            history: historyData.current,
            form: form
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

    const responseData = {
      current: leagueData,
      teamsHistory
    };

    setCachedData(cacheKey, responseData);
    return responseData;

  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
};