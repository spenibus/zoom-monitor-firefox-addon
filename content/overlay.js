/*
notes

getBoolPref is not a function
http://comments.gmane.org/gmane.comp.mozilla.project-owners/241

*/




//*********** export named single global object while using shorthand internally
var spenibus_zoomMonitor = (function() {




    //************************************************************** run on load
    window.addEventListener('load', (function f(){


        // remove init listener
        window.removeEventListener('load', f, false);


        // init
        //s.init.call(s);
        s.init();


    }), false);




    //******************************************************* internal shorthand
    var s = {};




    //***************************************************************** elements
    s.nodeMain  = null;
    s.nodeLabel = null;
    s.nodeMenu  = null;




    //************************************************************ prefs service
    s.ps = null;




    //************************************************************** node getter
    s.nodeGet = function(id) {

        // try document first
        var n = document.getElementById(id);

        // try toolbar palette if document yielded nothing
        if(n == null) {
            n = gNavToolbox.palette.querySelector('#'+id);
        }

        return n;
    };




    //***************************************************** check full-page mode
    s.fullGet = function() {
        return s.ps.getBoolPref("browser.zoom.full");
    };




    //******************************************************* zoom values getter
    s.zoomValuesGet = function() {
        return s.ps.getCharPref("toolkit.zoomManager.zoomValues")
            .split(",")
            .reverse();
    };




    //************************************************************** zoom setter
    s.zoomSet = function(z) {

        // change relevant zoom value
        s.fullGet()
            ? gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = z
            : gBrowser.selectedBrowser.markupDocumentViewer.textZoom = z;

        // update ui
        s.updateUI();
    };




    //*************************************************************** ui updater
    s.updateUI = function(e) {


        // main display
        s.nodeLabel.innerHTML = s.fullGet()
            ? 'F'+Math.round(gBrowser.selectedBrowser.markupDocumentViewer.fullZoom * 100)+'%'
            : 'T'+Math.round(gBrowser.selectedBrowser.markupDocumentViewer.textZoom * 100)+'%';


        // get current zoom level
        var currentZoom = s.fullGet()
            ? gBrowser.selectedBrowser.markupDocumentViewer.fullZoom
            : gBrowser.selectedBrowser.markupDocumentViewer.textZoom;


        var currentZoomPercentage = Math.round(currentZoom*100);


        // get zoom values
        var list = s.zoomValuesGet();


        // clear menu
        s.nodeMenu.innerHTML = '';


        // build menu
        for(var i=0; i<list.length; ++i) {


            var zoomFactor     = list[i];
            var zoomPercentage = Math.round(zoomFactor*100);


            // create menu item
            var item = document.createElement('menuitem');


            // set attributes
            item.setAttribute('label',     zoomPercentage+'%');
            item.setAttribute('data-zoom', zoomFactor);


            // highlight current zoom
            if(currentZoomPercentage == zoomPercentage) {
                item.classList.add("current");
            }


            // set command
            item.addEventListener("command", function(e){
                s.zoomSet(e.target.getAttribute('data-zoom'));
            }, false);


            // add item to menu
            s.nodeMenu.appendChild(item);
        }
    };




    //********************************************************************* init
    s.init = function() {


        // prefs service
        s.ps = Components
            .classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .QueryInterface(Components.interfaces.nsIPrefBranch);


        // get elements
        s.nodeMain  = s.nodeGet('spenibus_zoom_monitor_main');
        s.nodeLabel = s.nodeGet('spenibus_zoom_monitor_label');
        s.nodeMenu  = s.nodeGet('spenibus_zoom_monitor_menu');


        // override native function: enlarge/reduce
        FullZoom._applyZoomToPrefOriginal = FullZoom._applyZoomToPref;
        FullZoom._applyZoomToPref = function() {
            FullZoom._applyZoomToPrefOriginal.apply(this, arguments);
            s.updateUI();
        }


        // override native function: reset
        FullZoom._removePrefOriginal = FullZoom._removePref;
        FullZoom._removePref = function() {
            FullZoom._removePrefOriginal.apply(this, arguments);
            s.updateUI();
        }


        // event callback
        var callback = function(){
            s.updateUI.call(s);
        }


        // observe certain events
        gBrowser.tabContainer.addEventListener("TabOpen",   callback, false);
        gBrowser.tabContainer.addEventListener("TabSelect", callback, false);


        gBrowser.addEventListener("pageshow", callback, false);
        gBrowser.addEventListener("click",    callback, false);


        // update ui
        s.updateUI();
    };




    //******************************************************************* export
    return s;


})();