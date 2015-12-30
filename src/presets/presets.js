'use strict';

var fs = require('fs');

module.exports = {
    default: fs.readFileSync(__dirname + '/default.hjson', 'utf8'),
    lavarock: fs.readFileSync(__dirname + '/lavarock.hjson', 'utf8'),
    gaseous: fs.readFileSync(__dirname + '/gaseous.hjson', 'utf8'),
    luna: fs.readFileSync(__dirname + '/luna.hjson', 'utf8'),
    terra: fs.readFileSync(__dirname + '/terra.hjson', 'utf8')
};
