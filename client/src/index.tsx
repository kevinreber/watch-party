import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createWebStoragePersister } from 'react-query/createWebStoragePersister';
import { persistQueryClient } from 'react-query/persistQueryClient';

import App from './App';
import reportWebVitals from './reportWebVitals';

/**
 * @description
 * See: https://react-query.tanstack.com/devtools
 */
const ReactQueryDevTools = React.lazy(() =>
  import('react-query/devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);

const TWO_MINUTES_IN_MILLISECONDS = 1000 * 60 * 2;
const FIVE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 5;
const queryClient = new QueryClient({
  /**
   * @description
   * This is the global config for react query. These settings
   * can be overwritten on a per query basis inside our hooks.
   */
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: TWO_MINUTES_IN_MILLISECONDS,
      cacheTime: TWO_MINUTES_IN_MILLISECONDS,
      refetchInterval: FIVE_MINUTES_IN_MILLISECONDS,
    },
  },
});
const localStoragePersister = createWebStoragePersister({ storage: window.localStorage });

/**
 * @description
 * Cache API data in browser's localStorage. The advantage of using localStorage is that
 * localStorage data is persisted across web browser shutdown and page refreshes, whereas
 * if we used the in memory storage approach, the data is only persisted for the duration
 * of the user session.
 *
 * From a user & percieved performance point of view, having the data in localStorage is better in most cases.
 * 1. When we use localStorage & when a user refreshs or reopens their browser:
 *    - react-query will temporarily display the stale data using the localStorage data so the user sees data on screen faster (instead of a blank screen) & simulataneously
 *      do a background refetch of the data. Once the data refetech is complete, react-query will update the stale data in the UI seemesly with the refreshest data from the server.
 *      Users typically don't notice & background refetch happened).
 * 2. When we don't use localStorage strategy (not using `persisQueryClient` method below) and user refreshes the page:
 *    - react-query will need to wait for the server data to come back first before rendering any data. This differences from the localStorage approach which displays temporarily
 *      displays stale data while the server data is being fetched.
 *
 * See:
 * - https://react-query.tanstack.com/plugins/createWebStoragePersistor#_top
 * - also `interacting-with-react-query-cache.md` file in docs folder.
 */
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
});

ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </BrowserRouter>
    {process.env.NODE_ENV === 'development' && (
      <React.Suspense fallback={null}>
        <ReactQueryDevTools position="bottom-right" />
      </React.Suspense>
    )}
  </QueryClientProvider>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
