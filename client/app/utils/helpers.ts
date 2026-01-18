import getYouTubeID from "get-youtube-id";

export const isValidYTLink = (url: string): string | null => getYouTubeID(url);

export const ifArrayContains = (
  arr: Array<{ videoId: string }>,
  data: { videoId: string }
): boolean => {
  if (arr.length) {
    for (const obj of arr) {
      if (obj.videoId === data.videoId) return true;
    }
  }

  return false;
};

export const appendZero = (num: number): number | string =>
  num < 10 ? `0${num}` : num;

export const getFormattedTime = (time: number, remaining = false): string => {
  const dateTime = new Date(0, 0, 0, 0, 0, time, 0);

  const dateTimeH = appendZero(dateTime.getHours());
  const dateTimeM = appendZero(dateTime.getMinutes());
  const dateTimeS = appendZero(dateTime.getSeconds());
  const minus = remaining ? "-" : "";

  return dateTimeH > 0
    ? `${minus}${dateTimeH}:${dateTimeM}:${dateTimeS}`
    : `${minus}${dateTimeM}:${dateTimeS}`;
};

export const loadYTScript = (): void => {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";

  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  console.log("YouTube script appended");
};
