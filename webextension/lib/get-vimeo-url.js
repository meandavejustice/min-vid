const headers = new Headers({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
  // 'Content-Length': content.length.toString()
});

export default function(opts, cb) {
  const url = `https://player.vimeo.com/video/${opts.videoId}/config`;
  let item = {
    videoId: opts.videoId,
    domain: 'vimeo.com',
    error: false,
    title: '',
    preview: 'https://i.vimeocdn.com/video/error.jpg'
  };

  fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: headers,
    cache: 'default'
  }).then((res) => res.json()).then((json) => {
    if (json.request) {
      item = Object.assign(item, {
        url: json.request.files.progressive[0].url,
        launchUrl: json.request.share_url,
        title: json.video.title,
        preview: json.video.thumbs['960'],
        duration: json.video.duration
      });
    } else item.error = json.message;

    cb(item);
  }).catch((err) => {
    console.error(`Vimeo request via fetch failed: ${err}`);  // eslint-disable-line no-console
    item.error = 'errorMsg';
    cb(item);
  });
}
