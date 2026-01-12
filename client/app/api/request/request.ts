import axios from "axios";

/** Check for endpoint else use local server */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface RequestTypes {
  endpoint: string;
  paramsOrData?: Record<string, unknown>;
  verb?: "GET" | "POST" | "PUT" | "DELETE";
}

const request = async ({
  endpoint,
  paramsOrData = {},
  verb = "GET",
}: RequestTypes) => {
  console.debug("API Call:", endpoint, paramsOrData, verb);

  try {
    return (
      await axios({
        method: verb,
        url: `${BASE_URL}/api/${endpoint}`,
        [verb === "GET" ? "options" : "data"]: paramsOrData,
      })
    ).data;
    // axios sends query string data via the "params" key,
    // and request body data via the "data" key,
    // so the key we need depends on the HTTP verb
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios API Error: ", error.message);

      throw error.message;
    } else {
      console.error("API Error:", error);

      throw error;
    }
  }
};

export default request;
