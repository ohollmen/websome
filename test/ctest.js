#!/usr/bin/node
var webdata = require("../webdata.js");
//console.log(webdata);

// Sample data
var cdata = require("./testchart.json");

console.log(JSON.stringify(cdata, null, 2));
function addstats(cdata) {
  //console.log(cdata);
  webdata.chart_stats(cdata);
  console.log(JSON.stringify(cdata, null, 2));
}

function filter_data(cdata) {
  webdata.chart_smooth_filter(cdata, {winsize: 5, debug: 0});
  console.log(JSON.stringify(cdata, null, 2));
}
//addstats(cdata);
filter_data(cdata);
