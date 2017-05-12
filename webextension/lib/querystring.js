export {parse, stringify};

function parse(qs) {
  const result = {};
  const idx = qs.indexOf('?');
  qs.substr(idx + 1).split('&')
    .map(a => a.split('='))
    .map(a => result[a[0]] = encodeURI(a[1]));
  return result;
}

function stringify(params) {
  return Object.keys(params).map(k => `${k}=${params[k]}`).join('&');
}
