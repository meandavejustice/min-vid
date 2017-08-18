#!/usr/bin/env node
/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const fs = require('fs');
const archiver = require('archiver');


var output = fs.createWriteStream('addon.xpi');
var archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('warning', err => {
  if (err.code === 'ENOENT') console.log(err);
  else throw err;
});

archive.on('error', err => {
  throw err;
});

archive.pipe(output);

archive.glob('**', {ignore: fs.readFileSync('.zipignore', 'utf8').split('\n')});

archive.finalize();
