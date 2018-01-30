import { parse as qsParse, stringify } from './querystring';
import { parse, toSeconds } from 'iso8601-duration';

const apiKey = browser.runtime.getManifest().config.YOUTUBE_DATA_API_KEY;
const headers = new Headers({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
  // 'Content-Length': content.length.toString()
});

export default {
  getVideo
};

function getVideo(opts, cb) {
  const query = stringify({
    key: apiKey,
    id: opts.videoId,
    part: 'snippet,contentDetails,status'
  });

  const url = `https://www.googleapis.com/youtube/v3/videos?${query}`;

  fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: headers,
    cache: 'default' })
    .then((res) => res.json().then(function(json) {
      const result = json.items;
      const item = {
        cc: opts.cc,
        videoId: opts.videoId,
        url: `https://youtube.com/watch?v=${opts.videoId}`,
        domain: 'youtube.com',
        currentTime: opts.time || 0,
        error: false,
        title: (result.length) ? result[0].snippet.title : '',
        duration: result.length ? toSeconds(parse(result[0].contentDetails.duration)) : 0,
        preview: `https://img.youtube.com/vi/${opts.videoId}/0.jpg`,
        live: (result.length) ? Boolean(result[0].snippet.liveBroadcastContent === 'live') : false
      };

      const url = `https://www.youtube.com/get_video_info?video_id=${opts.videoId}`;
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: headers,
        cache: 'default' })
        .then((res) => res.text().then(function(text) {
          const result = qsParse(text);
          if (result.status === 'fail') {
            if (result.reason.indexOf('restricted')) item.error = 'errorYTNotAllowed';
            else item.error = 'errorYTNotFound';
          }

          cb(item);
        }));
    }));
}
