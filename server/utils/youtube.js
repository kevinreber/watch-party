import config from "../config.js";

// https://www.npmjs.com/package/youtube-api
import Youtube from "youtube-api";

if (config.YOUTUBE_API_KEY) {
  Youtube.authenticate({
    type: "key",
    key: config.YOUTUBE_API_KEY,
  });
}

const YOUTUBE_BASE_URL = "https://www.youtube.com/watch?v=";

// Example
// {
//   kind: 'youtube#searchResult',
//   etag: 'ghgSXsGTbBCM3Z89Sd8RRe_JFHw',
//   id: { kind: 'youtube#video', videoId: 'OHviieMFY0c' },
//   snippet: {
//     publishedAt: '2018-08-16T16:00:02Z',
//     channelId: 'UCV0qA-eDDICsRR9rPcnG7tw',
//     title: 'Cool Kids Code In Javascript (PART 3)',
//     description: 'Join my Crypto Discord Server and be part of my NFT project: https://discord.gg/vaxxeddoggos https://twitter.com/VaxxedDoggos ...',
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: 'Joma Tech',
//     liveBroadcastContent: 'none',
//     publishTime: '2018-08-16T16:00:02Z'
//   }
// }

// {
//   kind: 'youtube#searchResult',
//   etag: 'L_47pIDUMO3S1xSv9pYvM1BiA9c',
//   id: { kind: 'youtube#video', videoId: 'YssTeii5e98' },
//   snippet: {
//     publishedAt: '2022-07-06T15:31:31Z',
//     channelId: 'UCBj244LMgn9I1JfPNeLMyew',
//     title: 'i read 7 translated books in 7 days (and one made me cry lol)',
//     description: '[ad] check out Lingoda and use code JACK20: https://try.lingoda.com/JackEdwards links: second channel: ...',
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: 'Jack Edwards',
//     liveBroadcastContent: 'none',
//     publishTime: '2022-07-06T15:31:31Z'
//   }
// },
// {
//   kind: 'youtube#searchResult',
//   etag: 'bZLhpcdVX-AWHGHhAmm4SI4nY2A',
//   id: { kind: 'youtube#video', videoId: 'Z6jiMYnKTDI' },
//   snippet: {
//     publishedAt: '2021-02-18T07:05:55Z',
//     channelId: 'UChiIBU2vzkTjDicpXUdUZjg',
//     title: 'GROW UP DAVID | INTERPRETATION READING OF KIDS BOOKS | DAVID SHANNON',
//     description: "BOOKLINK: https://amzn.to/3q9EGZI Purchase a copy of this book to support the author. Today we're going to read Grow up, ...",
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: "Miss Sofie's Story Time - Kids Books Read Aloud",
//     liveBroadcastContent: 'none',
//     publishTime: '2021-02-18T07:05:55Z'
//   }
// },
// {
//   kind: 'youtube#searchResult',
//   etag: 'kONBhH29-MQmfBvBayzxqTNSShA',
//   id: { kind: 'youtube#video', videoId: 'eAbEhukrlOs' },
//   snippet: {
//     publishedAt: '2019-10-03T19:30:00Z',
//     channelId: 'UCbqmj1hzxuAXsjk08k-KP6w',
//     title: '📚 Kids Book Read Aloud: CREEPY PAIR OF UNDERWEAR by Aaron Reynolds and Peter Brown',
//     description: 'Jasper Rabbit needed new underwear. His mom took him to the underwear store to buy some plain white undies, but Jasper saw ...',
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: "StoryTime at Awnie's House",
//     liveBroadcastContent: 'none',
//     publishTime: '2019-10-03T19:30:00Z'
//   }
// },
// {
//   kind: 'youtube#searchResult',
//   etag: 'B8EAic-x-5f5Ld0qdz0eOxyesuY',
//   id: { kind: 'youtube#video', videoId: 'U1yj8DEBxxI' },
//   snippet: {
//     publishedAt: '2022-04-24T15:48:27Z',
//     channelId: 'UCNqLK36Gm214qufpgC5C45w',
//     title: '9 Books You NEED to Read *major page turners*',
//     description: '9 Books You NEED to Read *mystery & romance page turners* my jewelry collection ...',
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: 'Ava Jules',
//     liveBroadcastContent: 'none',
//     publishTime: '2022-04-24T15:48:27Z'
//   }
// },
// {
//   kind: 'youtube#searchResult',
//   etag: 'CSAUvRrLrioYGlGqKFVEUbWO-wU',
//   id: { kind: 'youtube#video', videoId: '-bMRoZqZgwM' },
//   snippet: {
//     publishedAt: '2022-02-15T14:00:00Z',
//     channelId: 'UCEPsNDUhUm-7yZhUjQQNqwQ',
//     title: 'The Cool Bean 😎 Read Aloud Kids Book',
//     description: 'The Cool Bean Read Aloud Kids Book You met The Bad Seed, The Good Egg & The Couch Potato Now meet The Cool ...',
//     thumbnails: { default: [Object], medium: [Object], high: [Object] },
//     channelTitle: 'KidTimeStoryTime',
//     liveBroadcastContent: 'none',
//     publishTime: '2022-02-15T14:00:00Z'
//   }
// }

// Re-formats data for each YouTube video
const mapYoutubeSearchResult = (video) => {
  console.log("VIDEO BEING FORMATTED IS");
  console.log(video);
  return {
    videoId: video.id.videoId,
    channel: video.snippet.channelTitle,
    description: video.snippet.description,
    url: `${YOUTUBE_BASE_URL}${video.id.videoId}`,
    name: video.snippet.title,
    img: video.snippet.thumbnails.default.url,
  };
};

export const searchYoutube = (query) => {
  const options = { part: "snippet", type: "video", maxResults: 5, q: query };
  return new Promise((resolve, reject) => {
    Youtube.search.list(options, (err, data) => {
      console.log("data is");
      console.log(data);
      console.log("error is");
      console.log(err);
      if (data && data.data.items) {
        const response = data.data.items.map((item) =>
          mapYoutubeSearchResult(item)
        );
        resolve(response);
      } else {
        console.warn(data);
        reject();
      }
    });
  });
};

const getYoutubeVideoID = (url) => {
  // const idParts = YOUTUBE_VIDEO_ID_REGEX.exec(url);
  if (!idParts) {
    return;
  }

  const id = idParts[1];
  if (!id) {
    return;
  }

  return id;
};
