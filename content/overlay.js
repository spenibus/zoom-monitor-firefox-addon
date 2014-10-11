/******************************************************************************/
var spenibus_zoomMonitor = {


   /**************************************************************** elements */
   nodeMain  : null,
   nodeLabel : null,
   nodeMenu  : null,




   /*********************************************************** prefs service */
   ps :null,




   /************************************************************* node getter */
   nodeGet : function(id) {

      // try document first
      var n = document.getElementById(id);

      // try toolbar palette if document yielded nothing
      if(n == null) {
         n = gNavToolbox.palette.querySelector('#'+id);
      }

      return n;
   },




   /**************************************************** check full-page mode */
   fullGet : function() {
      return this.ps.getBoolPref("browser.zoom.full");
   },




   /****************************************************** zoom values getter */
   zoomValuesGet : function() {
      return this.ps.getCharPref("toolkit.zoomManager.zoomValues")
         .split(",")
         .reverse();
   },




   /************************************************************* zoom setter */
   zoomSet : function(z) {

      // change relevant zoom value
      this.fullGet()
         ? gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = z
         : gBrowser.selectedBrowser.markupDocumentViewer.textZoom = z;

      // update ui
      this.updateUI();
   },




   /************************************************************** ui updater */
   updateUI : function(e) {

      // self reference for out of context calls
      var me = this;

      // main display
      this.nodeLabel.innerHTML = this.fullGet()
         ? 'F'+Math.round(gBrowser.selectedBrowser.markupDocumentViewer.fullZoom * 100)+'%'
         : 'T'+Math.round(gBrowser.selectedBrowser.markupDocumentViewer.textZoom * 100)+'%';

      // get current zoom level
      var currentZoom = this.fullGet()
         ? gBrowser.selectedBrowser.markupDocumentViewer.fullZoom
         : gBrowser.selectedBrowser.markupDocumentViewer.textZoom;

      var currentZoomPercentage = Math.round(currentZoom*100);

      // get zoom values
      var list = this.zoomValuesGet();

      // clear menu
      this.nodeMenu.innerHTML = '';

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
            me.zoomSet(e.target.getAttribute('data-zoom'));
         }, false);


         // add item to menu
         this.nodeMenu.appendChild(item);
      }
   },




   /******************************************************************** init */
   init : function() {

      // self reference for out of context calls
      var me = this;

      // prefs service
      this.ps = Components
         .classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService);

      // get elements
      this.nodeMain  = this.nodeGet('spenibus_zoom_monitor_main');
      this.nodeLabel = this.nodeGet('spenibus_zoom_monitor_label');
      this.nodeMenu  = this.nodeGet('spenibus_zoom_monitor_menu');

      // override native function: enlarge/reduce
      FullZoom._applyZoomToPrefOriginal = FullZoom._applyZoomToPref;
      FullZoom._applyZoomToPref = function() {
         FullZoom._applyZoomToPrefOriginal.apply(this, arguments);
         me.updateUI();
      }

      // override native function: reset
      FullZoom._removePrefOriginal = FullZoom._removePref;
      FullZoom._removePref = function() {
         FullZoom._removePrefOriginal.apply(this, arguments);
         me.updateUI();
      }

      // event callback
      var callback = function(){me.updateUI.call(me);}

      // observe certain events
      gBrowser.tabContainer.addEventListener("TabOpen",   callback, false);
      gBrowser.tabContainer.addEventListener("TabSelect", callback, false);

      gBrowser.addEventListener("pageshow", callback, false);
      gBrowser.addEventListener("click",    callback, false);

      // update ui
      this.updateUI();
   },
};




/*********************************************************************** init */
window.addEventListener("load", function(){
   spenibus_zoomMonitor.init.call(spenibus_zoomMonitor);
}, false);