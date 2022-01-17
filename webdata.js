var webdata = {
  //arravg : function(arr) { return arr.reduce((a,b) => a + b, 0) / arr.length; }
};
var window;

webdata.arravg = function(arr) { return arr.reduce((a,b) => a + b, 0) / arr.length; };

// Embed stats to chart
// TODO: Allow returning stats separately ?
webdata.chart_stats = function (cdata) {
  var dss  = cdata.datasets;
  if (!dss) { console.log("No datasets property (not a chart ?)"); return; }
  let tots = {min: 100000, max: -100000}; // TODO: avg: (as real sumtot / cnttot ?)
  dss.forEach((ds) => {
    ds.min = Math.min(...ds.data);
    ds.max = Math.max(...ds.data);
    ds.avg = webdata.arravg(ds.data);
    tots.min = Math.min(ds.min, tots.min);
    tots.max = Math.max(ds.max, tots.max);
    //console.log(`Avg ${ds.avg}`);
  });
  ["min","max"].forEach((k) => { cdata[k] = tots[k]; });
  // (Optional ?) Total avg: avg of avgs
  cdata.avg = webdata.arravg(dss.map((ds) => { return ds.avg; }));
};
/* Filter Chart data */
webdata.chart_smooth_filter = function (cdata, opts) {
  opts = opts || {winsize: 3, debug: 0};
  var dss  = cdata.datasets;
  var winsize = opts.winsize || 3;
  if (!dss) { console.log("No datasets property (not a chart ?)"); return; }
  if (winsize < 3) { console.log("winsize must be odd number and >= 3"); return; }
  if (!(winsize % 2)) { console.log("winsize must be odd number, got: "+winsize); return; }
  var debug = opts.debug;
  var compcb = opts.compcb || webdata.arravg;
  var surr = Math.floor(winsize/2); // Surrounding figures in window (e.g. 3 => 1, 5 => 2)
  debug && console.log("Surrounding: "+surr);
  dss.forEach((ds) => {
    //var i = 0;
    var data = ds.data;
    if (data.length < winsize) { throw "Dataset size < winsize - too small to do filtering !"; }
    var data2 = [];
    // Note: Must compute to new set as with "in-place" approach the filtering would start using earlier
    // filtered numbers (filtering would affect filtering)
    
    //if (winsize == 3) { calc_winsize3(data, data2, ds); return; }
    
    for (var i=0;i<data.length;i++) {
      var samples = [];
      // Beginning (full window cannot be used). Use first as multiple samples
      if (i < surr) {
        var samp0 = [];
	// Add repeating (Check how many)
	for (let j = i; j < surr; j++) { samp0.push(data[0]); } // CH: j=0 => j=i
	console.log("Start: samp0(repeated): ", samp0);
	// Start NOT correlating to i, must be 0
        samples = data.slice(0, i+surr+1); // Non-inc (Upper: same as mid-of-arr)
	console.log("Start-of-array, got from array: "+samples.length + " "+JSON.stringify(samples));
	samples = samp0.concat(samples);
	console.log("Start ready/final ("+samples.length+") ", samples);
        //data2[i] = webdata.arravg(samples);
      }
      // End (i == (data.length -1))
      else if (i > (data.length - surr-1)) {
        samples = data.slice(i-surr, data.length); // End must always be lastidx+1
	console.log("End: samp0(Got "+samples.length+"): ", samples);
	// Repeat Must increase towards end
	var cnt = winsize - samples.length;
	for (let j = 0; j < cnt; j++) { samples.push(data[data.length-1]); }
	console.log("End-of-array, got: "+samples.length+" "+JSON.stringify(samples));
        //data2[i] = webdata.arravg(samples);
      }
      // Samples in the middle or range
      else {
        var offs = i-surr;
	var offe = i+surr+1;
        samples = data.slice(offs, offe); // Latter said to be non-inclusive
	console.log("Mid-of-array, got: "+samples.length+" (From: "+offs+" to "+offe+" "+JSON.stringify(samples)+")");
        //data2[i] = webdata.arravg(samples);
      }
      // TODO: Compute here, allow any function, check #samples (?)
      if (samples.length != winsize) { throw "Samples not matching windowsize !"; }
      data2[i] = compcb(samples);
    }
    debug && console.log("==================================");
    
    // Take ds.data2 into use ?
    if (debug) { ds.data2 = data2; }
    else { ds.data = data2; } // delete(ds.data2);
  });
  // Initial hard-wired winsize: 3
  function calc_winsize3(data, data2, ds) {
    for (var i=0;i<data.length;i++) {
      // Beginning (i==0). Double up first
      if (i == 0) { data2[i] = compcb([data[0], data[0], data[1]]); }
      // End (i == (data.length -1))
      else if (i == (data.length -1)) { data2[i] = compcb([data[i-1], data[i], data[i]]); }
      // Sample in the middle
      else { data2[i] = compcb([data[i-1], data[i], data[i+1]]); }
    }
    if (debug) { ds.data2 = data2; }
    else { ds.data = data2; } // delete(ds.data2);
  }
};

if (!window) { module.exports = webdata; }
