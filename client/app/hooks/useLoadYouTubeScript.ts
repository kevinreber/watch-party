import { useEffect } from "react";
import { loadYTScript } from "~/utils/helpers";

export const useLoadYouTubeScript = () => {
  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      loadYTScript();
    }
  }, []);
};
