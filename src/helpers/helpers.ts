import getYouTubeID from 'get-youtube-id';

export const isValidYTLink = (url: string) => getYouTubeID(url);

export const appendZero = (num: any): number | string =>
	num < 10 ? `0${num}` : num;

export const getFormattedTime = (
	time: any,
	remaining: boolean = false
): string => {
	const dateTime = new Date(0, 0, 0, 0, 0, time, 0);

	const dateTimeH = appendZero(dateTime.getHours());
	const dateTimeM = appendZero(dateTime.getMinutes());
	const dateTimeS = appendZero(dateTime.getSeconds());
	const minus = remaining ? '-' : '';

	return dateTimeH > 0
		? `${minus}${dateTimeH}:${dateTimeM}:${dateTimeS}`
		: `${minus}${dateTimeM}:${dateTimeS}`;
};
