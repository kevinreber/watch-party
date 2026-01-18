import axios, { AxiosRequestConfig } from 'axios';

/** Check for endpoint else use local server */
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

interface RequestTypes {
  endpoint: string;
  paramsOrData?: Record<string, unknown>;
  verb?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

const request = async <T = unknown>({
  endpoint,
  paramsOrData = {},
  verb = 'GET',
}: RequestTypes): Promise<T> => {
  console.debug('API Call:', endpoint, paramsOrData, verb);

  try {
    const config: AxiosRequestConfig = {
      method: verb,
      url: `${BASE_URL}/api/${endpoint}`,
    };

    // axios sends query string data via the "params" key for GET requests,
    // and request body data via the "data" key for other methods
    if (verb === 'GET') {
      config.params = paramsOrData;
    } else {
      config.data = paramsOrData;
    }

    return (await axios(config)).data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios API Error:', error.message);
      throw new Error(error.response?.data?.message || error.message);
    } else {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default request;
