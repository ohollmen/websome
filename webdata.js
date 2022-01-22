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
  }); // forEach
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
/** Clean up unwanted _meta attribute from chart datasets.
* Once rendered chart data seems to be injected with Chart.js _meta helper
* property that seems to contain circular references. To clone data this must
* be cleaned up. Cleanup happens in all datasets.
* @param cdata {object} - Chart data (with labels, datasets)
*/
webdata.chart_metaclean = function (cdata) {
  cdata.datasets.forEach((ds) => { delete(ds._meta); });
};
/** Sample labels for last date and return Date object for it.
* In cases where data cannot be parsed, null is returned (parsing exceptions are caught).
* @param cdata {object} - Chart data
* @return JS Date Object or null on failed parsing.
*/
webdata.chart_lastdate = function (cdata) {
  if (!cdata) { return null; }
  var lbs = cdata.labels;
  if (!lbs || !Array.isArray(lbs)) { console.log("No labels or labels not in array"); return null; }
  var lv = lbs[lbs.length-1];
  var d;
  try { d = new Date(lv); }
  catch (ex) { console.log("Last label ("+lv+") not in Date parseable format"); return null; }
  return d;
};
/** Assign colors to datasets from colorarray.
* If array has less colors than there are datasets reuse/multiply colors as much as needed.
*/
webdata.chart_colorset = function (cdata, colarr) {
  if (!cdata || !cdata.datasets) { return; }
  if (!colarr) { return; }
  var clen = cdata.datasets.length;
  if (colarr.length >= clen) { } // NOP
  // TODO: See if we can handle this by indexing
  else {
    colarr = [...colarr]; // Clone
    while (colarr.length < clen) {
      colarr = colarr.concat(colarr);
    }
  }
  console.log("DS-len: "+clen+" Now have "+colarr.length+" colors");
  var i = 0;
  cdata.datasets.forEach((ds) => {
    ds.borderColor = colarr[i];
    ds.borderWidth = 1;
    i++;
    // if (i >= colarr.length) { i = 0; }
  });
};
/** Find timelimit in labels where data should be sliced.
* Assumes all labels (cdata.labels) to be in (JS Data()) parseable time format.
* Tested with ISO time, not sure if others work.
* Note: Only labels are accessed during this op.
* @param cdata - Chart data
* @param ts - Time in second
* @return The index of first element to keep
*/
webdata.chart_timelim_idx = function (cdata, ts, opts) {
  opts = opts || {copy: 0, debug: 0, refnow: 0};
  if (!ts) { console.log("Got:"+ts); return; }
  // TODO: Covert all to use ms (ts, ut, dt) ts*=1000;
  var ut;
  if (opts.refnow) { ut = Math.floor(Date.now() / 1000); } // new Date();
  // Better reference - end of data. Check dl
  else { let dl = webdata.chart_lastdate(cdata); ut = Math.floor(dl / 1000); }
  var dt = ut - ts;
  dt = dt*1000; // 
  var d = new Date(dt);
  if (opts.debug) {
    console.log("ST("+dt+"): ", d);
    console.log("Time at "+dt+" ms. is "+d.toISOString());
    console.log("labels cnt:", cdata.labels.length);
  }
  var i = 0;
  var dls = cdata.labels;
  for (;i<dls.length;i++) {
    let d2 = new Date(dls[i]); // Date.parse();
    //console.log(d2.toISOString());
    // Note: .getMilliseconds(); gets ONLY the ms part
    opts.debug && console.log("CMP("+i+"): "+d+" "+d2);
    if (d2 > d) { break; }
  }
  if (i >= dls.length) { console.log("Reached end ("+i+") No match !!!"); return -1; }
  console.log("Item: "+i+" ... "+dls[i]+ " newer vs. "+d.toISOString());
  return i;
};

/** Slice data vectors and labels at an offset.
* 
* @param cdata {object} chart data
* @param idx {number} - Index/Offset. The value at offset will be still kept (inclusive)
* @params opts {object} - Options object (w. copy: true/false)
* Return chart
* @todo Allow window from idx0 ... idx1
*/
webdata.chart_slice = function (cdata, idx, opts) {
  if (!cdata) { return; }
  if (idx < 1) { return; }
  opts = opts || {};
  /// Slicing
  // if (opts.copy) { cdata = rapp.dclone(cdata); }
  cdata.labels = cdata.labels.slice(idx);
  var dss = cdata.datasets;
  // Also colors, etc ?
  dss.forEach((ds) => { ds.data = ds.data.slice(idx); });
  opts.debug && console.log("POST-TLIM: ", cdata);
};

if (!window) { module.exports = webdata; }
