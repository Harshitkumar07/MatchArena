const axios = require('axios');
const pRetry = require('p-retry');
const functions = require('firebase-functions');

/**
 * Create axios instance with retry logic
 */
const createHttpClient = (baseURL, headers = {}) => {
  const client = axios.create({
    baseURL,
    timeout: 8000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...headers
    }
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      functions.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      functions.logger.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      functions.logger.debug(`API Response: ${response.status} from ${response.config.url}`);
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url;
      
      functions.logger.error(`API Error: ${status || 'Network'} from ${url}`, {
        status,
        message: error.message,
        data: error.response?.data
      });
      
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Make HTTP request with retry logic
 */
const makeRequestWithRetry = async (requestFn, options = {}) => {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 5000,
    factor = 2
  } = options;

  return pRetry(
    async () => {
      const response = await requestFn();
      return response;
    },
    {
      retries,
      minTimeout,
      maxTimeout,
      factor,
      onFailedAttempt: (error) => {
        const status = error.response?.status;
        
        // Don't retry on client errors (except 429)
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
        
        functions.logger.warn(`Retry attempt ${error.attemptNumber} after error:`, {
          message: error.message,
          status,
          retriesLeft: error.retriesLeft
        });
      }
    }
  );
};

/**
 * Handle API response and extract data
 */
const handleApiResponse = (response, dataPath = 'data') => {
  if (!response || !response.data) {
    throw new Error('Invalid API response');
  }

  // Handle different API response formats
  const data = response.data;
  
  // CricAPI format
  if (data.status === 'success' && data.data) {
    return data.data;
  }
  
  // API-Sports format
  if (data.response !== undefined) {
    return data.response;
  }
  
  // Direct data
  return data[dataPath] || data;
};

/**
 * Make GET request with query parameters
 */
const get = async (client, endpoint, params = {}, options = {}) => {
  const requestFn = () => client.get(endpoint, { params });
  const response = await makeRequestWithRetry(requestFn, options);
  return handleApiResponse(response);
};

/**
 * Make POST request
 */
const post = async (client, endpoint, data = {}, options = {}) => {
  const requestFn = () => client.post(endpoint, data);
  const response = await makeRequestWithRetry(requestFn, options);
  return handleApiResponse(response);
};

module.exports = {
  createHttpClient,
  makeRequestWithRetry,
  handleApiResponse,
  get,
  post
};