/** Web Forms GUI related utilities
* - Creating form
* - Getting a Form inputs as object to process / send via http to server side
* - Dealing with select menus
* - Getting multiple values or child-collection for a form param
* - Commonly used custom widgets / patterns
*/

var webformui = {};

webformui.getformvals =  function (fid, opts) {
  opts = opts || { debug: 0 };
  // Global indication of debug (class var ?)
  //if (webview.debug) { opts.debug = webview.debug; }
  var f = document.getElementById(fid);
  // console.log("form field type:",f.numvert.type);
  // console.log(Object.keys(f)); // 0,1,2,3
  if (opts.debug) { console.log("Form:" + f); }
  var kv = {}; // Form k-v Object to return
  var tconvs = {
     "number": function (v) {return parseFloat(v);},
     "int":    function (v) {return parseInt(v);},
     //"": function () {},
  };
  var arr;
  // .serialize() creates a (query) string, serializeArray() an AoO
  if (opts.usejq) { arr = $('#'+fid).serializeArray(); }
  else { arr = webformui.formdata_as_arr(f); }
  if (opts.debug > 0) { console.log(JSON.stringify(arr, null, 2)); }
  // Loop trough JQuery created AoO
  arr.forEach(function (it) {
    var k = it.name;
    // NOTE: Order is inportant
    var t = f[k].getAttribute('data-type') || f[k]['type'];
    // TODO: Take a multival-hint from widget itself (likely select) ?
    let mval = f[k].getAttribute("multiple"); // TODO: Utilize below
    // NOTE: HTML select returns type "select-one" (!) - use data-type here ! (must use add'l special handling ?)
    if (opts.debug) { console.log(k + " is of type " + t + ". Check need to Convert ..."); }
    if (t && tconvs[t]) {
      // console.log(k + ' is ' + t);
      it.value = tconvs[t](it.value);
    }
    // 
    if (kv[k] && opts.multival) {
      //if (opts.debug) { console.log(`Convert ${k} to multival`); }
      //if ( Array.isArray(kv[k]) ) { kv[k].push(it.value); }
      //else { kv[k] = [ kv[k], it.value ]; } // Second multival, conv. to array (of first and second)
      multival (kv, k, it.value);
    }
    else {
      if (mval) { multival (kv, k, it.value); }
      else { kv[it.name] = it.value; }
    }
  });
  // (Force) Store as multival (in error tolerant way)
  function multival (kv, k, v) {
    if (opts.debug) { console.log(`Convert ${k} to multival`); }
    if (!kv[k]) { kv[k] = [v]; }
    else if ( Array.isArray(kv[k]) ) { kv[k].push(v); }
    else { kv[k] = [ kv[k], v ]; } // Second multival, conv. to array (of first and second)
  }
  if (opts.debug) { console.log("Collected (form) K-V Object: ", kv); } // arr, 
  return(kv);
}


// Return Form data gotten by std/built-in new FormData(f) method.
// Converts data into AoO format familiar from JQ .serializeArray().
// This will will turn FormData into AoO easier to dump and process (as std. array w. array methods).
// @return array of items with name and value.
webformui.formdata_as_arr = function (f) {
  // Validate f as HTMLFormElement' (Also .nodeName, .tagName ?)
  if (!(e instanceof HTMLFormElement)) { console.error("Form is not HTMLFormElement !"); return null; }
  var formData = new FormData(f);
  // var fdp = formData.getAll(); // get(key) / getAll(somepara)
  //var fdp = formData.values(); // Use .entries()
  //let ents = formData.entries();
  let arr = []; // "map" to JQ serializeArray() format (name,value)
  // .entries() Always creates exactly "tuples" of 2 (k, v). multivals create multiple array items.
  for (var pair of formData.entries()) { arr.push({ name: pair[0], value: pair[1] }); }
  return arr;
}

// Populate options on selects with attribute "autobind"
// Raw DOM version of view_autobind_jq.
webformui.view_autobind = function () {
  var abels = document.querySelectorAll('select[autobind]');
  console.log(`Got ${abels.length} autobind els (dom)`);
  var bcnt = 0;
  for (var i = 0; i < abels.length; i++) {
    let f = abels[i].closest("form");
    // Check and skip nonsleect elems ? if () {}
    var bindid = f.id +"." + abels[i].name; // el.getAttribute("name") or el.name
    if (!optionsets[ bindid ]) { abels[i].innerHTML = "<option>ERROR</option>"; console.error(`Error: Form.Elem ${bindid} wanted autobind, but no opts were found !`); break; }
    webview.addoptions( optionsets[ bindid ], abels[i]); bcnt++;
  }
  //console.log(`Bound ${bcnt} autobind  (dom)`);
}
// Set value.
// Need to potentially .add() and item for graceful behaviour (to not lose value).
// Note: sel.selectedIndex only applies on non-multiple selects (in those set to first selected)
// There is sel.selectedOptions for one-or-may items
webformui.setselect = function (sel, val) {
  var manyidx;
  var selcnt = 0;
  
  if (val == null) { return; }
  // Need to reset options first ??? !!!
  var opts = Array.from(sel.options);
  opts.forEach( (opt) => { opt.selected = false; });
  // Validate this is select !
  if ( ! (sel.type == 'select-multiple' || sel.type == 'select-one' )) { console.error("Not a select !"); return; }
  if (Array.isArray(val)) {
    // Check multiple (or just se.multiple)
    if ( ! f.getAttribute("multiple")) { console.error("Received multi/arr values, but not a multiple select"); return; }
    val.forEach( (v) => { manyidx[v] = true; });
  }
  //else { f[name]...}
  var expcnt = manyidx ? manyidx.length : 1;
  for (let i = 0;i < sel.options.length;i++) {
    var opt = sel.options[i]; // has value, text, selected
    if (manyidx && manyidx[opt.value]) { opt.selected = true; selcnt++; delete manyidx[opt.value]; }
    else if (opt.value == val.toString()) { opt.selected = true; selcnt++; }
  }
  // if not found in iteration - must add, but without proper .text (raw vals only)
  // if (selcnt != expcnt) {
  //   var toadd = manyidx ? Object.keys(manyidx) : [val];
  //   toadd.forEach( (v) => {
  //     var opt = new Option(v, v, false, true); // or document.createElement("option");
  //     sel.add(apt); // or sel.appendChild(opt);
  //   }
  //}
}
// Prepare a dialog for pre-populated values lookup.
// Get dialog title from ... ???
webformui.listdialog = function (butt, optslist, opts) {
  opts = opts || {debug: 1};
  if (!butt) { console.error("No button passed !!!"); }
  // Must have data-tgt
  var ddiv = document.createElement("div");
  ddiv.id = butt.id+"_12345"; // TODO: More unique/totally unique
  ddiv.title = butt.value; // Set dialog (div) title (req'd by JQ). Also allow coming from ... (?)
  if (opts.cb) { ddiv.innerHTML = opts.cb(optslist); }
  var dd = $(ddiv).dialog({ autoOpen: false, modal: true, });
  if (opts.debug) { console.log("Created div and dialog (for button "+butt.id+")"); }
  
  // TODO: Grab target from button(input[type=button]) here
  var tgt = butt.dataset.tgt; // OLD: this in inner cb
  var tgtel = document.querySelector(tgt);
  // Show missing tgtel *already* at form view load  (uisetup) time !!!
  if (!tgtel) { alert("No tgt el for selector "+tgt); return; }
  // .type
  if (opts.debug) { console.log("Checked target "+tgt+" and resolved element "+tgtel+" (for button "+butt.id+")"); }
  
  $( "#"+butt.id ).button().on( "click", function() {
      console.log("CLICK on button");
         
  
      if (opts.debug) { console.log("Button "+butt.id+" => Dialog (choices) => "+tgt); }
      // OLD: "#rfdialog a". TODO: hard elem, sub-sel
      $( "#"+ddiv.id+ " a" ).click(function () {
        console.log("CLICK on list-anchor");
        //var v = $(this).data('val'); // Uses data-val="..."
	var v = this.dataset.val;
        // console.log(v); // Paste back to ...
        //$( "#totalratio input[name=rf]" ).val(v);
        document.querySelector(tgt).value = v; // tgtel.value = v;
        dd.dialog( "close" );
	// Delete (temp) dialog div after use (when dialog closes) !
	ddiv.remove()
      });
      dd.dialog( "open" );
    });
  
};
