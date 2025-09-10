import cricketAdapter from './cricket';
import footballAdapter from './football';
import kabaddiAdapter from './kabaddi';
import { SPORT_TYPE, AdapterError, ERROR_CODES } from './base';

/**
 * Factory function to get the appropriate adapter for a sport
 * @param {string} sport - Sport type from SPORT_TYPE constants
 * @returns {BaseSportAdapter} The adapter instance for the sport
 */
export function getAdapter(sport) {
  switch (sport) {
    case SPORT_TYPE.CRICKET:
      return cricketAdapter;
    case SPORT_TYPE.FOOTBALL:
      return footballAdapter;
    case SPORT_TYPE.KABADDI:
      return kabaddiAdapter;
    default:
      throw new AdapterError(
        `No adapter available for sport: ${sport}`,
        ERROR_CODES.NOT_IMPLEMENTED,
        { sport }
      );
  }
}

/**
 * Get all available sports
 * @returns {Array<string>} Array of available sport types
 */
export function getAvailableSports() {
  return [
    SPORT_TYPE.CRICKET,
    SPORT_TYPE.FOOTBALL,
    SPORT_TYPE.KABADDI
  ];
}

/**
 * Get live matches across all sports
 * @returns {Promise<Array>} Array of live matches from all sports
 */
export async function getAllLiveMatches() {
  const sports = getAvailableSports();
  const promises = sports.map(sport => {
    const adapter = getAdapter(sport);
    return adapter.getLiveMatches().catch(err => {
      console.error(`Error fetching live matches for ${sport}:`, err);
      return [];
    });
  });
  
  const results = await Promise.all(promises);
  return results.flat().sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Search matches across all sports
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching results from all sports
 */
export async function searchAllMatches(query) {
  const sports = getAvailableSports();
  const promises = sports.map(sport => {
    const adapter = getAdapter(sport);
    return adapter.searchMatches(query).catch(err => {
      console.error(`Error searching matches for ${sport}:`, err);
      return [];
    });
  });
  
  const results = await Promise.all(promises);
  return results.flat();
}

// Export adapters individually for direct access if needed
export { cricketAdapter, footballAdapter, kabaddiAdapter };

// Re-export useful constants and classes from base
export { SPORT_TYPE, MATCH_STATUS, AdapterError, ERROR_CODES } from './base';
