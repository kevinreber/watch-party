import React from 'react';
import { loadYTScript } from '@helpers';

export const useLoadYouTubeScript = () => {
  // Load YT IFrame Player script into html
  React.useEffect(() => {
    // @ts-ignore
    if (!window.YT) {
      // @ts-ignore
      loadYTScript();
    }
  }, []);
};
