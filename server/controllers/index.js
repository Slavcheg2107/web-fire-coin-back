'use strict';

const fs = require('fs');
const path = require('path');

const API_ENDPOINT = '/api';

module.exports = {
  init(app) {
    fs.readdirSync(__dirname)
      .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
      .forEach(file => app.use(API_ENDPOINT, require(path.join(__dirname, file))));
  }
};
