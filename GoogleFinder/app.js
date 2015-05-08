/* global process */
var googleFinder = require("./googleFinder");

var _googleKey = "AIzaSyDctaGcuexOtvyNDFbespSLhInXAvEiqgU";
var _cx = "010604737292908226044:f7s-wgg22yi";
var _q = '"http://static.wixstatic.com"';

var _runningInterval = process.argv[2] || 60*1000;
var _overrideTotalPages = process.argv[3];

console.log(_runningInterval);
googleFinder.start(_googleKey, _cx, _q, _runningInterval, _overrideTotalPages);

