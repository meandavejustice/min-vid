import { parse as qsParse, stringify } from './querystring';
import { parse, toSeconds } from 'iso8601-duration';

const apiKey = browser.runtime.getManifest().config.YOUTUBE_DATA_API_KEY;
const headers = new Headers({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
  // 'Content-Length': content.length.toString()
});

export default {
  getVideo,
  getPlaylist,
  getPlaylistMeta
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

function getPlaylistMeta(opts, cb) {
  let query = stringify({
    key: apiKey,
    part: 'snippet',
    id: opts.playlistId
  });

  const url = `https://www.googleapis.com/youtube/v3/playlists?${query}`;
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: headers,
    cache: 'default' })
    .then((res) => res.json().then(function(json) {
      const result = json.items[0].snippet;

      query = qsParse(query);
      query.id = opts.videoId;
      query = stringify(query);

      const url = `https://www.googleapis.com/youtube/v3/videos?${query}`;
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: headers,
        cache: 'default' })
        .then((res) => res.json().then(function(json) {
          cb(Object.assign(opts, {
            playlistTitle: result.title,
            videoTitle: json.items[0].snippet.title
          }));
        }));
    }));
}

function getPlaylist(opts, cb, passedPlaylist) {
  const query = stringify({
    key: apiKey,
    part: 'snippet',
    playlistId: opts.playlistId,
    maxResults: 50,
    pageToken: opts.pageToken || ''
  });

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?${query}`;
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: headers,
    cache: 'default' })
    .then((res) => res.json().then(function(json) {
      const result = json;
      if (result.pageInfo.totalResults <= 50) {
        Promise.all(result.items.map(i => getVideoDetails(i.snippet.resourceId.videoId, i.snippet.position)))
          .then(playlist => cb(playlist.sort((a, b) => a.position - b.position)));
      } else {
        const shouldFetch = result.items[result.items.length - 1].snippet.position < result.pageInfo.totalResults - 1;
        Promise.all(result.items.map(i => getVideoDetails(i.snippet.resourceId.videoId, i.snippet.position)))
          .then(playlist => passedPlaylist ? passedPlaylist.concat(playlist) : playlist)
          .then(playlist => (shouldFetch) ? getPlaylist(Object.assign(qsParse(query), {pageToken: result.nextPageToken}), cb, playlist)
                : cb(playlist));
      }
    }));
}

function getVideoDetails(videoId, position) {
  return new Promise((resolve) => {
    getVideo({
      time: 0,
      videoId
    }, item => {
      item.position = position;
      resolve(item);
    });
  });
}
