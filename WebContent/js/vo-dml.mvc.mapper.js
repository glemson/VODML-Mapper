
var MapperController = function(config, modelsManager, tablesManager, baseController)
{
	var that = this;
	var states = null;

	var mapContainer = jQuery("#"+config.mapperDiv);
	mapContainer.addClass("jstree-drop");

	this.getCurrentState = function(){
		return baseController.getCurrentState();
	};
	this.setCurrentState = function(state){
		return baseController.setCurrentState(state);
	};
	this.mapperView = new MapperView(mapContainer, modelsManager, tablesManager);
	var mappingConsole = new MappingConsole(config, this);
	
	jsPlumb.Defaults.Container = mapContainer;// $("table");//mapContainer;
	jsPlumb.setContainer(mapContainer); // for jsPlumb 1.6.2
	

	this.showType = function(vodmlref, position, state)
	{
		that.mapperView.showType(vodmlref,position, state);
	};

	// calculate position wrt screen for a position wrt to the mapContainer
	this.globalPosition = function(position){
		var left = position.x+mapContainer.position().left-mapContainer.scrollLeft();
		var top = position.y+mapContainer.position().top-mapContainer.scrollTop();
		return {x:left, y:top};
	};
	this.showTable = function(table, position, id) {
		that.mapperView.showTable(table, position, id);
	};
	this.showState = function()
	{
		mappingConsole.refresh();
	};
	this.loadState = function(state)
	{
		baseController.loadState(state);
	};
	this.loadMapping = function(id, isPublic)
	{
		baseController.loadMapping(id, isPublic);
	};
	this.drawConnection = function(con){
		that.mapperView.drawConnection(con);
	};

	this.getState = function()
	{
		return that.mapperView.getState();
	};
	this.toVOTable = function()
	{
    	var vodml2VOTableMapper = new VODML2VOTableAnnotator(tablesManager, modelsManager);
    			//new VODML2VOTableMapper(tablesManager, modelsManager);
    	var votable = vodml2VOTableMapper.toVOTable(that.getState());
    	return votable;
	};

	// SAVE STATE dialog
	jQuery("#savestate_dialog").dialog({buttons:[{text:"Save", click:function(){
		jQuery(this).dialog("close");
		that.saveStateFromDialogue();
	}},{text:"Cancel", click:function(){
		jQuery(this).dialog("close");
	}}]});
	this.saveState = function(){
		var dia= jQuery("#savestate_dialog");
		var currentState = that.getCurrentState();
		if(currentState == null)
		{
			jQuery("#savestate_insert").attr("checked",true);
			jQuery("#savestate_update").attr("enabled",false);
			jQuery("#state_label").val(null); 
			jQuery("#state_annotation").val(null); 
		}
		else
		{
			jQuery("#savestate_update").attr("checked",true);
			jQuery("#savestate_update").attr("enabled",true);
			jQuery("#state_label").val(currentState.label); 
			jQuery("#state_annotation").val(currentState.annotation); 
		}
		dia.dialog("open");
	};
	
	
	this.saveStateFromDialogue = function()
	{
		var state = that.getState();
		
		var data = new Object();
		data.action="SAVESTATE";
		data.state=state;
		data.annotation = jQuery("#state_annotation").val();
		data.label = jQuery("#state_label").val();
		
		var currentState = that.getCurrentState();
		var radio = jQuery("#savestate_update");
		if(currentState != null && radio.attr("checked") == "checked")
		{
			var _id = currentState["_id"]["$oid"];
			data._id = _id;
		}
		jQuery.post(UploaderURL,JSON.stringify(data,null,""), function(message,testStatus) {
				var result = jQuery.parseJSON(message);
				if(result["result"] != "ok"){
					alert("Problem saving state:" +result["message"]);
				} else {
					that.setCurrentState(result["state"])
					that.refreshStates(true);
				}
			},"text");
	};
	this.removeState = function(stateId)
	{
		var data = new Object();
		data.action="REMOVESTATE";
		data["_id"]=stateId; //(state["_id"])["$oid"];
		jQuery.post(UploaderURL,JSON.stringify(data,null,""), function(message,testStatus) {
			var result = jQuery.parseJSON(message);
			if(result == null){
				alert("No result returned after deleteing state. Message = "+message);
			} else {
			if(result["result"] != "ok"){
				alert("Problem removing state:" +result["message"]);
			} else {
				that.refreshStates(true);
			}
			}
			},"text");
	};
	this.deRegisterPublicMapping = function(_id)
	{
		var data = new Object();
		data.action="DEREGISTERPUBLICMAPPING";
		data["_id"]=_id;
		jQuery.post(UploaderURL, JSON.stringify(data, null, ""), function(message, testStatus) {
			var result = jQuery.parseJSON(message);
			if (result == null) {
				alert("SYSTEMERROR: No result returned after deregistering public mapping.");
				logConsole.log("SYSTEMERROR: No result returned after deregistering public mapping.", that.name);
			} else {
				if (result["result"] != "ok") {
					alert("Problem deregistering state:" + result["message"]);
				} else {
					logConsole.log("State with _id=" + _id + " successfully de-registered from public mappings.", that.name);
					that.refreshStates(true);
				}
			}
		}, "text");
	};
	this.publishMapping = function(stateId)
	{
		var data = new Object();
		data.action="PUBLISH_MAPPING";
		data["_id"]=stateId;
		data["keep"] = "true"; // TODO make this choosable
		jQuery.post(UploaderURL,JSON.stringify(data,null,""), function(message,testStatus) {
			var result = jQuery.parseJSON(message);
			if(result == null){
				alert("No result returned after publishing mapping. Message = "+message);
			} else {
			if(result["result"] != "ok"){
				alert("Problem while publishing state:" +result["message"]);
			} 
			that.refreshStates(true);
			}
			},"text");
	};
	
	
	this.refreshStates = function(async) {
		async = typeof async !== 'undefined'?async:true;
//		this.notifyLoadStatesStarted();
		url=refreshStatesURL;
		jQuery.ajax({
			url:url,
			async:async,
			dataType:"json",
			success: function(states) {
				doRefreshStates(states);
			},
			error: function(error){
				alert("Error while trying to refresh list of states. Message:"+error.message);
			}
		});

	};
	// Should do this in specialized view for states
    function doRefreshStates(newstates)
    {
    	var table = jQuery("#mymaps_table").dataTable();
    	table.fnClearTable();
   		states = newstates["user"];
   		jQuery.each(states, function(i) {
   			var annotation = this.annotation;
   			if(annotation == null) annotation = "";
   			var tr = table.fnAddData([this["_id"]["$oid"],this.label,this.insertTime,annotation]);  			
   		});
    	table = jQuery("#publicmaps_table").dataTable();
    	table.fnClearTable();
   		var pubstates = newstates["public"];
   		jQuery.each(pubstates, function(i) {
   			var owner = this.owner;
   			if(owner == null) owner = "unknown";
   			var annotation = this.annotation;
   			if(annotation == null) annotation = "";
   			var tr = table.fnAddData([this["_id"]["$oid"],owner,this.publicationTime,this.label,annotation]);  			
   		});
   	};
   	

	function init(){
		jQuery("#browsestates_dialog").dialog({
			width :800,
			modal:false,
			buttons:[
			    {text:"Close", click:function(){
			    	jQuery(this).dialog("close");
				}}
				
			]
		});
		jQuery("#mapscontainertabs").tabs();
		jQuery("#savedmapstabs").tabs();
		// init statestable
		jQuery("#mymaps_table").dataTable({
			"aoColumnDefs" : [ {
				"aTargets" : [ 0 ],
				"bSortable" : false,
				"fnCreatedCell" : function(nTd, sData, oData, iRow, iCol) {
					var b1 = jQuery('<img src="css/images/Button-Download-icon-24.png">');
					b1.on('click', function() {
						that.loadMapping(oData[0], false);
					});
					var b2 = jQuery('<img src="css/images/Button-Delete-icon-24.png">');
					b2.on('click', function() {
						that.removeState(oData[0]);
					});
					var b3 = jQuery('<img src="css/images/publish-icon-24.png">');
					b3.on('click', function() {
						that.publishMapping(oData[0]);
					});
					jQuery(nTd).empty();
					jQuery(nTd).prepend(b2);
					jQuery(nTd).prepend("&nbsp;&nbsp;");
					jQuery(nTd).prepend(b3);
					jQuery(nTd).prepend("&nbsp;&nbsp;");
					jQuery(nTd).prepend(b1);
				}
			} ]
		});
		jQuery("#publicmaps_table").dataTable({
			"aoColumnDefs" : [ {
				"bSortable" : false,
				"aTargets" : [ 0 ],
				"fnCreatedCell" : function(nTd, sData, oData, iRow, iCol) {
					var b1 = jQuery('<img src="css/images/Button-Download-icon-24.png">');
					b1.on('click', function() {
						that.loadPublicMapping(oData[0]);
					});
					var b2 = jQuery('<img src="css/images/Button-Delete-icon-24.png">');
					b2.on('click', function() {
						that.deRegisterPublicMapping(oData[0]);
					});
					jQuery(nTd).empty();
					jQuery(nTd).prepend(b2);
					jQuery(nTd).prepend("&nbsp;&nbsp;");
					jQuery(nTd).prepend(b1);
				}
			} ]
		});
		jQuery("#searchmaps_table").dataTable({
			"aoColumnDefs" : [ {
				"bSortable" : false,
				"aTargets" : [ 0 ],
				"fnCreatedCell" : function(nTd, sData, oData, iRow, iCol) {
					var b1 = jQuery('<img src="css/images/Button-Download-icon-24.png">');
					b1.on('click', function() {
						that.loadMapping(oData[0]);
					});
					jQuery(nTd).empty();
					jQuery(nTd).prepend(b1);
				}
			} ]
		});
		jQuery("#searchmaps_submit").click(function(){
			that.queryPublicMappings();
		});
		jQuery("#RefreshMyMaps").click(function(){
			that.refreshStates();
		});
		initAutocomplete("searchmaps_models", modelsManager.vodml.getModelNames, "40em");
		initAutocomplete("searchmaps_types", modelsManager.vodml.getAllPaths, "40em");
	};
	init();
	// Autocomplete functions
	// from jQuery UI automcomplete
	// http://jqueryui.com/autocomplete/#multiple
	function initAutocomplete(id, listFnct,w){
		jQuery("#"+id)
	      // don't navigate away from the field on tab when selecting an item
	      .bind( "keydown", function( event ) {
	        if ( event.keyCode === $.ui.keyCode.TAB &&
	            $( this ).data( "ui-autocomplete" ).menu.active ) {
	          event.preventDefault();
	        }
	      })
	      .autocomplete({
	        minLength: 0,
	        source: function( request, response ) {
	          // delegate back to autocomplete, but extract the last term
	          response( $.ui.autocomplete.filter(
	            listFnct(), extractLast( request.term ) ) );
	        },
	        focus: function() {
	          // prevent value inserted on focus
	          return false;
	        },
	        select: function( event, ui ) {
	          var terms = split( this.value );
	          // remove the current input
	          terms.pop();
	          // add the selected item
	          terms.push( ui.item.value );
	          // add placeholder to get the comma-and-space at the end
	          terms.push( "" );
	          this.value = terms.join( " " );
	          return false;
	        }
	      }).width(w);
		
	}
    function split( val ) {
        return val.split( / \s*/ );
    }
    function extractLast( term ) {
        return split( term ).pop();
    }


	this.queryPublicMappings = function(){
		var data = new Object();
		data.action="QUERY_MAPPINGS";
		if(jQuery("#searchmap_includemodel").is(":checked"))
			data.models = jQuery("#searchmaps_models").val();
		if(jQuery("#searchmap_includetype").is(":checked"))
			data.types = getVodmlrefs4Paths(jQuery("#searchmaps_types").val());
		if(jQuery("#searchmap_includevodmlref").is(":checked"))
			data.vodmlrefs = jQuery("#searchmaps_vodmlrefs").val();
		jQuery.ajax({
			url:QueryStatesURL,
			data:data,
			async:true,
			dataType:"json",
			success: function(mappings) {
				refreshQueryTable(mappings);
			},
			error: function(error){
				alert("Error while trying to query public mappings. Message:"+error.message);
			}
		});

	};

	function getVodmlrefs4Paths(paths){
		var parts = jQuery.trim(paths).split(/[ ]+/);
		var vodmlref = "";
		var count = 0;
		jQuery.each(parts, function(index, value){
			if(count > 0) vodmlref=vodmlref+" ";
			var type = modelsManager.vodml.findType4Path(parts[index]);
			if(type != null){
				vodmlref = vodmlref+type.vodmlref;
				count = count+1;
			}
			else
				alert("Cannot find vodmlref for path '"+parts[index]+"'");
		});
		return vodmlref;
	}
	function refreshQueryTable(mappings){
    	table = jQuery("#searchmaps_table").dataTable();
    	table.fnClearTable();
   		jQuery.each(mappings, function(i) {
   			var owner = this.owner;
   			if(owner == null) owner = "unknown";
   			var annotation = this.annotation;
   			if(annotation == null) annotation = "";
   			var tr = table.fnAddData([this["_id"]["$oid"],owner,this.publicationTime,this.label,annotation]);  			
   		});

	}
	this.loadPublicMapping = function(_id){
		baseController.loadMapping(_id,true);
	};
	this.clearAll = function()
	{
		that.mapperView.clearAll();
	};

};
var MappingConsole = function(config, mapperController)
{
	var tabId = config.mappingTab;
	var consoleId = config.mappingConsole;
	var that = this;
    var mappingConsole = jQuery("#"+consoleId);

    this.asJSON = function()
    {
    	var state = mapperController.getState();
    	var text= JSON.stringify(state,null,"\t");
    	openStateDialog(text, "json");
    };
    this.toVOTable = function()
    {
    	var votable = mapperController.toVOTable();
    	var text = new XMLSerializer().serializeToString(votable);
    	openStateDialog(text, "xml");
    };
    this.toVOTableACE = function()
    {
    	var votable = mapperController.toVOTable();
    	var xmlContent = new XMLSerializer().serializeToString(votable);
    	openMappingDialog(xmlContent, "xml");
    };
    this.toVOTableWindow = function()
    {
    	var votable = mapperController.toVOTable();
    	var xmlContent = new XMLSerializer().serializeToString(votable);
// next does not work for IE it seems
    	window.open('data:text/xml,'+encodeURIComponent(xmlContent),"xml");
    };
    	
    function openStateDialog(text, mode){
    	if(mode == "json")
    	{
        	mappingConsole.text(text);
    	}
    	else if (mode = "xml"){
    		mappingConsole.text(vkbeautify.xml(text));
    	}
		jQuery("#showstate_dialog").dialog("open");
    };
    //---------------------------------------------------------
    //---  ACE does not work great this way, need to learn more
/*
    var aceeditor = ace.edit("aceeditor");
    aceeditor.setReadOnly(true);  
//    aceeditor.setTheme("ace/theme/monokai");
    aceeditor.$blockScrolling = Infinity
*/
    function openMappingDialog(text, mode){
       	if(mode == "json")
       	{
       	    aceeditor.getSession().setMode("ace/mode/json");
        	aceeditor.setValue(text,0);
       	}
       	else if (mode = "xml"){
       	    aceeditor.getSession().setMode("ace/mode/xml");
        	aceeditor.setValue(vkbeautify.xml(text),0);
       	}
       	aceeditor.resize()
   		jQuery("#showmapping_dialog").dialog("open");
    };
    //---------------------------------------------------------
    
	var menu = [{
		'Clear mapper' : function(menuItem, menu) {
			mapperController.clearAll();
		},
		'Browse Other Mappings' : function(menuItem, menu) {
			jQuery("#browsestates_dialog").dialog("open");
		},
		'Save Mapping' : function(menuItem, menu) {
			mapperController.saveState();
		},
		'Show Mapping as JSON' : function(menuItem, menu) {
			that.asJSON();
		},
		'Show Mapping as VOTable' : function(menuItem, menu) {
			that.toVOTable();
		},
		'Show Mapping as VOTable in new Window (only tested on Chrome/Firefox)' : function(menuItem, menu) {
			that.toVOTableWindow();
		}
//		,'Save mapping as image' : function(menuItem, menu) {
//			var w=window.open('about:blank','image from canvas');
//			var canvas = null;
//			var d = null;
//			var promise= html2canvas(document.getElementById("mapperdiv"));
//			var canvas = promise.then(function(canvas){		 
//				theCanvas = canvas;
////               document.body.appendChild(canvas);
//	
//	            // Convert and download as image 
//	            Canvas2Image.saveAsPNG(canvas); 
//				d=canvas.toDataURL("image/png");
////				var w=window.open();
//				w.document.write("<img src='"+d+"' alt='from canvas'/>");
//			});
//		}
//		,'Show Mapping as VOTable with ACE' : function(menuItem, menu) {
//			that.toVOTableACE();
//		}
	} ];
//	var browser = jQuery.browser; // deprecated
//	if(jQuery.browser.chrome || jQuery.browser.firefox)

//	jQuery("#"+tabId).contextMenu(menu, {});
	jQuery("#"+config.mapperDiv).contextMenu(menu, {});
	
    this.clear = function()
    {
    	mappingConsole.text("");
    };
};

// ===============================================
// settings for jsPlumb objects
// ===============================================
var MapperView = function(mapContainer,  models, tablesManager) {
	var that = this;
	var mapperView = this;
	var objects = new Object();
	var tables = new Object();
	tablesManager.mapperView = this;
	this.name = "MAPPER";
	logConsole.log("Starting.....\n",that.name);
// methods/vars for creating random IDs
	var date = "T"+(new Date()).getTime(); // ID of current state
	var counter = 1;
	function reset() {
		that.initState("T"+(new Date()).getTime(),1);
	}
	this.initState = function(state_date, state_counter) {
		date = state_date;
		counter = state_counter;
	};
	
	jsPlumb.bind("connectionDragStop",function(conn, event){
		if(conn.target == null){
			that.openType4Connection(conn, event);
		} else {
//			alert("Dragging of connection was stopped on target endpoint with id "+conn.targetId);
		}
	});


	this.openType4Connection = function(connection, event) {
		var ep = jQuery("#"+connection.sourceId)[0];
		var vodmlref = jQuery(ep).attr("vodmlref");
		if(vodmlref == null) return; // ignore instance links
		var objectId = jQuery(ep).attr("objectId");
		var rank = jQuery(ep).attr("rank");
		var elFrom = models.vodml.findVODMLElement(vodmlref);
		var conn = new Object();
		var position={x:event.clientX, y:event.clientY};
		conn.from = {objectId:objectId,vodmlref:vodmlref, role:{vodmlref:vodmlref},rank:rank};

		var role = models.find(vodmlref);
		var datatype =  jQuery(ep).attr("datatype"); //jQuery(role).find(">datatype>vodml-ref").text();
		var types = models.vodml.findTypeHierarchy(datatype);
		// var role = modelsManager.vodml.findVODMLElement(sourceId);
		var vodmlrefs = []
		jQuery.each(types, function(index, value)
		{
			vodmlrefs.push(value)
		});
		if(elFrom.tagName == "reference"){
			vodmlrefs.push("vo-dml:ORMReference");
			vodmlrefs.push("vo-dml:RemoteReference");
		}

		if(vodmlrefs.length ==1){
			drawAndConnectType(elFrom, conn, vodmlrefs[0],position);
		} else {
			jQuery("#endpoint_datatypes").html('<OPTION>'+vodmlrefs.join('</OPTION><OPTION>')+'</OPTION>');
			var diag = jQuery("#type4connection_dialog");
			diag.dialog({
				title : "Select type for " + vodmlref,
				buttons : [ {
					text : "Select",
					click : function() {
						var vodmlref = jQuery("#endpoint_datatypes option:selected").text();
						drawAndConnectType(elFrom,conn,vodmlref,position)
						jQuery(this).dialog("close");
					}
				}, {
					text : "Cancel",
					click : function() {
						jQuery(this).dialog("close");
					}
				} ]
			});
			diag.dialog("open");
		}
	};	

	function drawAndConnectType(elFrom, conn, vodmlref, position){
		var elTo = models.vodml.findVODMLElement(vodmlref);
		var connectorType = "";
		if(elFrom.tagName == "attribute"){
			connectorType = elTo.tagName;
		} else {
			connectorType = elFrom.tagName;
		}
		var newtype = that.showType(vodmlref, position,null);
		conn.to = {objectId:newtype,vodmlref:vodmlref, type:{vodmlref:vodmlref},connectorType:connectorType};

		that.drawConnection(conn);
	}
	
	// something to do with ??? TODO find out
	jQuery("body").append("<span id=\"rulerspan\" style=\"visibility:hidden;white-space:nowrap;\"></span>");
	// clear whole view, update counters
	this.clearAll = function()
	{
		reset(); // reset date and counter for id generation.
		jsPlumb.setSuspendDrawing(true);
		
		// to speed things up, first call following methods to get rid of
		// jsplumb connections and endpoints.
		// only doing this implicitly through the individual remove calls is
		// very slow for larger graphs
		jsPlumb.detachEveryConnection();
		jsPlumb.deleteEveryEndpoint();

		jQuery.each(objects, function(key, value)
		{
			removeType(key);
		});
		jQuery.each(tables, function(key, value)
		{
			removeTable(key);
		});
		jsPlumb.setSuspendDrawing(false, true);

	};
	
	this.clearAllObjects = function()
	{
		jsPlumb.setSuspendDrawing(true);
		
		jQuery.each(objects, function(key, value)
		{
			removeType(key);
		});
		jsPlumb.setSuspendDrawing(false, true);

	};

	this.clearAllTables = function()
	{
		jsPlumb.setSuspendDrawing(true);
		
		jQuery.each(tables, function(key, value)
		{
			removeTable(key);
		});
		jsPlumb.setSuspendDrawing(false, true);

	};
	
//-------------------------------------------
	function isSpecialDataType(dt)
	{
		return (dt == "ivoa:Quantity"
			|| dt == "ivoa:RealQuantity"
			|| dt == "ivoa:IntegerQuantity"
			|| dt == "vo-dml:Identifier");
	}
	// node data management
	function newId()
	{
		var id = date+"_"+counter;
		counter=counter+1;
		return id;
	}
	function newIdentifiedNode(nodeClass, id)
	{
		id = (typeof id !== 'undefined' && id != null)?id:newId();
		var node = jQuery("<div id='"+id+"'></div>");
		if(nodeClass != null)
			node.addClass(nodeClass);
		return node;
	};
	function newTypeNode(vodmlref, vodmltype, id)
	{
		id = typeof id !=='undefined' && id != null?id:newId();
		var node = newIdentifiedNode(null,id);
		var object = new Object();
		object["id"] = node[0].id;
		object["vodmlref"] = vodmlref;
		object["vodmltype"] = vodmltype;
		var src = models.findType(vodmlref);
		if(src != null){  // TODO else should alert?
			object["path"] = src.path;
			object["description"]=src.description; // NB src has ref to model which has ref to src, i.e. circular, cannot JSON.stringify.
		}
		objects[object.id] = object;
		return node;
	}
	function newTableNode(table, id)
	{
		id = typeof id !=='undefined' && id != null?id:newId();
		var node = newIdentifiedNode(null, id);
		var tbl = new Object();
		tbl["source_table"] = table;
		tbl["id"] = node[0].id;
		tbl["table_name"] = table.name;
		tbl["info"] = table.info;
		tables[tbl.id] = tbl;
		return node;
	}
	function removeType(id){
		var object = objects[id];
		// TODO, check object not null
		jsPlumb.remove(id);
		delete objects[id];
		logConsole.log("Removed instance of "+object.vodmlref+" ["+id+"]", that.name);
	};
	function removeTypeConfirm(id){
		var object = objects[id];
		// TODO, check object not null
		var question = "do you want to remove instance of  "+ object.vodmlref+" ["+object.id+"] ?";
		confirmDialogue(question, function(){		
			removeType(id);
		});
	};
	function removeTable(id){
		var table = tables[id];
		// TODO, check table not null
		jsPlumb.remove(id);
		delete tables[id];
		logConsole.log("Removed table "+table.name+" ["+id+"]", that.name);
	};
	function removeTableConfirm(id){
		var table = tables[id];
		// TODO, check object not null
		var question = "do you want to remove table "+table.table_name+" ["+id+"] ?";
		confirmDialogue(question, function(){		
			removeTable(id);
		});
	};
	// function that should check consistency between cache of objects/tables and actual mapper view
	function checkConsistency()
	{
		// TODO implement
	};

    //-------------------------------------------------------------------	
	
	// dialog with callback
	function confirmDialogue(question, callbackFnc) {
		var r=confirm(question);
		if (r==true)
		  {
			callbackFnc.call();
			return true;
		  }
		else
	  {
		  return false;
		  }
	};
	
	var referenceColor = "green";
	var compositionColor = "blue";
	var primitiveColor = "black";
	var dataTypeColor = "red";
	var targetDropOptions = {};
	var connectorHoverStyle = {
		lineWidth : 4,
		strokeStyle : "orange",
		cursor : 'pointer'
	};
	var connectorOverlays = [ [ "Arrow", {
		width : 13,
		length : 20,
		foldback : 0,
		location : 0.8,
		id : "arrow"
	} ] ];

	/* vodmlref refers to the element the endpoint is connected to */
	function typeEndpoint(vodmlref, objectId, connectorType, maxconnections) {
		var type = models.find(vodmlref);
		var params = {
			"objectId": objectId,
			"vodmlref":vodmlref,
			"type":{
				"vodmltype":type.nodeName,
				"vodmlref":vodmlref
			},
			"connectorType":connectorType
		};
		return endpoint(params,(connectorType != "instance"),connectorType,maxconnections);
	};
	function roleEndpoint(role, connectorType, objectId, rank) {
		var info = role.info;
		var params = {
			"objectId":objectId,
			"vodmlref":info.vodmlref,
			"rank":rank,
			"role":{				
				"vodmltype": info.vodmltype,
				"vodmlref":info.vodmlref,
				"name":info.name,
				"datatype":info.datatype
//				"minOccurs":info.minOccurs,
//				"maxOccurs":info.maxOccurs,
			},
			"connectorType":connectorType
		};
		return endpoint(params,false,connectorType,info.maxOccurs);
	}
	function tableEndpoint(tableId) {
		var params = {
			"tableId":tableId,
			"connectorType":"table"
		};
		return endpoint(params,true,params.connectorType,-1);
	}
	function columnEndpoint(column, tableId) {
		var params = {
			"tableId":tableId,
			"name":column.name,
			"column": {
				"name":column.name,
				"datatype":column.datatype,
				"description":column.description,
				"rank":column.rank,
				"xmlid":column["xmlid"],
				"type":column.type,
			},
			"connectorType":"tableColumn"
		};
		return endpoint(params,true,params.connectorType,-1);
	};
	function endpoint(params, isTarget, connectorType, maxconnections) {
		var anchor = [0.5,0.5,1,0];
		var isSource=!isTarget;
		if(isTarget) anchor = [0.5,0.5,-1,0];
		var color = primitiveColor;
		if(connectorType == "composition"){
			color = compositionColor;
			if(isTarget) maxconnections=1; // TBD is this correct?
		} else if(connectorType == "reference") {
			color = referenceColor;
			if(isTarget) maxconnections=-1;
			else maxConnections=1;
		} else if(connectorType == "dataType") {
			color = dataTypeColor;
			if(isTarget) maxconnections=-1;
			else maxConnections=1;
		} else if(connectorType == "primitiveType" || connectorType == 'enumeration') {
			color = primitiveColor;
			if(isTarget) maxconnections=-1;
			else maxConnections=1;
		} else if(connectorType = "tableColumn"){
			color = primitiveColor;
		} else {
			alert("Unknown connectorType "+connectorType);
			return null;
		};
		var paintStyle= {
			fillStyle : color
		};
		if(connectorType == "dataType" && !isTarget){
			var dt = params.role.datatype;
			if(isSpecialDataType(dt))
			{
				paintStyle = {
						gradient : {
							stops:[ [0, dataTypeColor], [1, primitiveColor] ]
						}
					};
			};
		};
		
		if(!isTarget && connectorType != "composition" && connectorType != "tableColumn") ;
		params.endpointId=newId();
		var ep = {
			anchor :anchor,
			endpoint : [ "Dot", {
				radius : 10,
			} ],
			paintStyle : paintStyle,
			isSource : !isTarget,
			isTarget : isTarget,
			connectorStyle : {
				strokeStyle : color,
				lineWidth : 3
			},
			connector : [ "Bezier", {
				curviness : 150
			} ],
			connectorHoverStyle : connectorHoverStyle,
			connectorOverlays : connectorOverlays,
			maxConnections : maxconnections,
			parameters : params,
			beforeDrop:function(conn) { 
				var isOK = checkConnection(conn); 
				if(isOK) {
					conn.connection.bind("click",function(conn){
//						jsPlumb.detach(conn);
						confirmDialogue("do you want to delete this connection?", function(){		
							jsPlumb.detach(conn);
						});
					});
					// TODO set color to gradient?
				}
				return isOK;
			},
			beforeDetach:function(conn) { 
//				var ok = confirm("Detach connection?");
//				if(ok){
//					if(mapContainer == null)
//						alert("Weird");
//				}
				return true; 
			}
		};

		return ep;
	};
	// Checks whether a connection, defined by info, can be made legally.
	// i.e. implements the valid mappings
	var checkConnection = function(info) {
		var sourceType = info.connection.endpoints[0].getParameter("connectorType");
		var role = info.connection.endpoints[0].getParameter("role");
		var targetType = info.dropEndpoint.getParameter("connectorType");

		var isOK = false;
		var message = null;
		if(targetType == "table"){
			if(sourceType == "instance") {
				message = "Connecting instance to table ";
				isOK = true;
			} else {
				isOK = false;
				message = "Illegal attempt made to connect a "+sourceType+" to table ";
			}
			// sourceType must be a type instance
		}
		else if(targetType == "tableColumn") {
			if(sourceType == "instance")
			{
				isOK = false;
				message = "Cannot map an instance connector to a table column";
			} else {
				var column = info.dropEndpoint.getParameter("column");
				message = "Connecting " + role.vodmltype + " [" + role.vodmlref + "] to "+column.type+ " " + column._name;
				if (sourceType == "primitiveType" || sourceType == "enumeration") {
					isOK = true;
				} else if (sourceType == 'dataType') {
					isOK = isSpecialDataType(role.datatype);
				} else { // if(sourcetype='objectType'
					isOK = false;
					message = "Cannot map an objecttype to a table column";
				}
			}
		} else {// targetType is a vodml type
			var target = info.dropEndpoint.getParameter("type");
			if(sourceType == targetType) {
				if(target != null){
					if(models.checkRoleTypeCompatible(role.datatype, target.vodmlref)){
						message = "Connecting "+role.vodmlref+" to "+target.vodmlref;
						isOK = true;
					} else if(role.vodmlref == "vo-dml:ORMReference.TARGET"
						&& targetType == "reference"){
						message="Connecting vo-dml:ORMReference.target to object type " + target.vodmlref;
						isOK = true;
					} else if(sourceType == "reference" 
						&& target.vodmlref == "vo-dml:ORMReference") {
						message = "Connecting "+role.vodmlref+" to "+target.vodmlref;
						isOK = true;
					} else {
						message = "Illegal attempt made to connect "+role.vodmlref+" to "+target.vodmlref;
						isOK = false;
					}
				} else {
					isOK = false;
					message ="Target 'type' unknown";
				};
			} else if (sourceType == 'dataType' && targetType == 'primitiveType'){
				// some ivoa Quantity types can be mapped to appopriate primitives
				message = "Can not yet map dataType-s to primitiveType-s";
				isOK = false;
			}
			else {
				isOK = false;
				message ="Illegal attempt made to connect a " + role.vodmltype + " ["+role.vodmlref+"] to the " 
				+ targetType +" endpoint of <<"
				+ target.vodmltype +">> ["+target.vodmlref+"]";
			}
		};
		if(isOK)
		{
				logConsole.log(message, that.name);
		} else {
			alert(message);
		}
		return isOK;
	};
	function newendpointTD(tr,isTarget, rowspan)
	{
		var s_rowspan = "";
		if(rowspan > 1) s_rowspan=" rowspan="+rowspan;
		var td = jQuery("<td"+s_rowspan+"></td>");
		tr.append(td);
		if(isTarget) {
			td.addClass("targetendpoint");
		} else {
			td.addClass("sourceendpoint");
		}
		return td;
	};

	function showTypeInfo(object)
	{
		alert(JSON.stringify(object,null,"\t"));
	};
	function showRoleInfo(role)
	{
		alert(JSON.stringify(role,null,"\t"));
	};
	this.showType = function(vodmlref, position, state) {
		return addType(vodmlref, position, state);
	};
	// define next separately so it shows up in eclipse
	function addType(vodmlref, position, state)
	{
		var id  = (state != null?state.id:null);
		var type = models.find(vodmlref);
		if(type == null){
			logConsole.log("no type found for vodmlref '"+vodmlref+"'","MAPPERVIEW::addType");
			return; // TODO throw error?
		}
		var vodmlType = type.nodeName;
		var node = newTypeNode(vodmlref, vodmlType, id);
		id = node[0].id; // ensure that in case objectId was null, it is now properly set
		// TODO calculate required width for nice display without wrapping
		var maxWidth = 0;
		var roles;
		if(vodmlType == 'objectType' || vodmlType == 'dataType'){
			var cache = new Array();
			findAllRoles(type, cache);
			var subsetCache = new Object(); // keyed by vodmlref of role, first one encountered for given vodmlref is stored
			findAllSubsets(type, subsetCache);

			roles = prepareRoles(cache, subsetCache, vodmlref);
			jQuery.each(roles,function(){
				maxWidth = Math.max(this.title.visualLength(),maxWidth);
			});
		}
		mapContainer.append(node);
//		node.resizable({handles: 'e, w'});
		jsPlumb.draggable(
			node,
			{
			containment:'parent',
			distance:10,
			scroll:'true',
			stack:'true'
			}
		);
		node.addClass('rootnode');
		var fontSize=parseFloat(node.css("fontSize"));
		maxWidth = Math.max(25,2+(maxWidth+30)/fontSize); // 30 for width endpoints
		node.css("width",maxWidth+"em");
		
		if(position != null) {
			var left = position.x-mapContainer.position().left+mapContainer.scrollLeft();
			var top = position.y-mapContainer.position().top+mapContainer.scrollTop();
			node.css("left",left+"px");
			node.css("top",top+"px");
		}
		var tbl = jQuery("<table></table>");
		tbl.addClass('node');
		tbl.addClass(vodmlType);
		node.append(tbl);
		if(vodmlType == 'objectType' || vodmlType == 'dataType'){
			// TODO calculate max width
			addTypeHeader(vodmlref,tbl, id);
			jQuery.each(roles, function(){
				var literal = (state != null && this.info.vodmltype == "attribute"? findLiteral(state.literals, this.info.vodmlref):null);
				var arraysize = (state != null ? findArraysize(state.arrays, this.info.vodmlref):1);
				addRole(this, tbl, id, node, literal, arraysize);
			});
		} else {
			addTypeHeader(vodmlref,tbl, id);
			var literal = (state != null && state.value?state.value:null);
			addValueField(vodmlref, tbl, id, literal);
		}
		addTypeMenu(node,id, tbl);
		node.animate(tbl.height());
		try {
		jsPlumb.recalculateOffsets(node);
		} catch(e){}
		logConsole.log("Added instance of '"+vodmlref+"' [id="+node[0].id+"]", that.name);
		return node[0].id;
	};

	
	function findLiteral(literals, vodmlref){
	    for (var i = 0, len = literals.length; i < len; i++) {
	        if (literals[i].vodmlref === vodmlref)
	            return literals[i].value; // Return as soon as the object is found
	    }
	    return null; // The object was not found
	};
	function findArraysize(arrays, vodmlref){
		if(arrays != null){
		    for (var i = 0, len = arrays.length; i < len; i++) {
		        if (arrays[i].vodmlref === vodmlref)
		            return arrays[i].length; // Return as soon as the object is found
		    }
		}
	    return 1; // The object was not found
	};
	
	function textWidth(word){
		  var span = '<span>' + word + '</span>';
		  return jQuery(span).width();
	};
	function addTypeMenu(node, id, tableNode)
	{
		var object = objects[id];
		var menu = [ {
			'Show info (JSON)' : function(menuItem, menu) {
				showTypeInfo(object);
			},
			'Delete' : function(menuItem, menu) {
				removeTypeConfirm(id);
			},
			'Collapse' : function(menuItem, menu) {
				that.collapse(id, node);
			},
			'Expand' : function(menuItem, menu) {
				expand(id, node);
			}
//			,
//			'Bring to front':function(menuItem, menu){
//				findMaxZIndex(id,node);
//			}
		} ];
		node.contextMenu(menu, {});
	};
	// works for 
	this.collapse = function(id, node)
	{
		var trs = jQuery("#"+id + " table.node tr.role");
		jQuery.each(trs, function(){
			if(jQuery(this).hasClass("as_constant")) return;
			var epDIV = jQuery(this).find(">td.sourceendpoint div");
			var cons = jsPlumb.getConnections({source:epDIV[0].id});
			if(cons == null || cons.length == 0) {
				jsPlumb.selectEndpoints({element:$(epDIV)}).setVisible(false);
		    	jQuery(this).hide();
		    }; 
		});
		node.addClass("collapsed");
		jsPlumb.repaintEverything();
		jsPlumb.recalculateOffsets(node);

	}
	function expand(id, node)
	{
		var trs = jQuery("#"+id + " table.node tr.role");
		jQuery.each(trs, function(){
			jQuery(this).show();
			var ep = jQuery(this).find(">td.sourceendpoint div");
			jsPlumb.selectEndpoints({element:$(ep)}).setVisible(true);
		});
		jsPlumb.repaintEverything();
		jsPlumb.recalculateOffsets(node);
		node.removeClass("collapsed");

	}
	
	function findMaxZIndex(id,node){
		var s="";
		var index_highest=null;
		mapContainer.find("*").each(function(){
		    var index_current = parseInt($(this).css("zIndex"), 10);
		    if(index_current > index_highest) {
		        index_highest = index_current;
		    }
		})
//		jQuery(node).zIndex(index_highest+1);
		s=s+"<br/>setting node.zIndex to "+index_highest+1; 
		var trs = jQuery("#"+id + " table.node tr.role");
		jQuery.each(trs, function(){
			var eptd = jQuery(this).find("td:last");
			// remove outgoing link if one exists
			var ep = eptd.find("div.endpoint");
			// todo also remove endpoint circle
			// increase index of the the dot, which otherwise is behind its parent
			var eps=jsPlumb.selectEndpoints({element:$(ep)});
			if(eps && eps.length){
				eps[0].zIndex(index_highest+1);   
			}
//			var epDIV = jQuery(this).find(">td.endpoint div").zIndex(index_highest+1);
//			jQuery.each(jsPlumb.selectEndpoints({element:$(epDIV)}),function(){
//				var ep = jQuery(this);
//				s=s+"<br/>setting endpoint.zIndex to "+index_highest+1; 
////				ep.zIndex(index_highest+1);
//				if(ep.endpoint){
//					ep.endpoint.zIndex(index_highest+1);
//					if(ep.endpoint.svg){
//						s=s+"<br/>setting endpoint.svg.zIndex to "+index_highest+1; 
////						ep.endpoint.svg.zIndex(index_highest+1);
//					}
//				}
//			});
		});
//		jsPlumb.repaintEverything();
//		jsPlumb.recalculateOffsets(node);
	}
	function addTypeHeader(vodmlref, tbl, id) {
		var type = models.find(vodmlref);
		var vodmlType = type.nodeName;
		var tr = jQuery("<tr></tr>");
		tr.addClass("title");
		tbl.append(tr);
		var container = null;
		var connectorType = vodmlType;
		var num = 1;
		var rowspan=1;
		if(vodmlType == 'objectType'){//} && vodmlref!="vo-dml:Reference"){
			connectorType = "reference";
			num = -1; // max number of connections
			container = models.findContainer(vodmlref);
			if(container != null) rowspan=2;
		} else if(vodmlref=="vo-dml:ORMReference" || vodmlref=="vo-dml:RemoteReference"){
			connectorType = "reference";
		}
		var epTD = newendpointTD(tr, true); // returns TD
		var epNode = newIdentifiedNode("endpoint"); // returns DIV
		epTD.append(epNode);
		var sp = typeEndpoint(vodmlref, id, connectorType, num);
		add_jsPlumb_Endpoint(epNode, sp);
		var info = JSON.stringify(objects[id],null,"\t");
		var span = "<span title='"+info+"'>";
		var title = "&lt;&lt"+vodmlType+"&gt;&gt;<br/>"+vodmlref;
		title = span+title+"</span>";
//		title=vodmlref;
		var ntd = jQuery("<td rowspan="+rowspan+">"+title+"</td>");
		tr.append(ntd);
		ntd.addClass("titleNode");

		if(vodmlType == 'objectType' || vodmlType=="dataType"){
			epTD = newendpointTD(tr, false, rowspan); // returns TD
			epNode = newIdentifiedNode("endpoint"); // returns DIV
			epTD.append(epNode);
			var sp = typeEndpoint(vodmlref, id, "instance", num);
			add_jsPlumb_Endpoint(epNode, sp);
		}
		if(container != null){
			// second slot
			tr = jQuery("<tr></tr>");
			tbl.append(tr);
			epTD = newendpointTD(tr, true); // returns TD
			epNode = newIdentifiedNode("endpoint"); // returns DIV
			epTD.append(epNode);

			sp = typeEndpoint(vodmlref, id, "composition", 1);
			add_jsPlumb_Endpoint(epNode, sp);
		}
		return ntd; // the node with name, to which context-menu will be added
	};
	

	function addValueField(vodmlref, tbl, objectId, literal) {
		var tr = jQuery("<tr></tr>");
		tbl.append(tr);
		tr.addClass("role");
		var td = jQuery("<td colspan=2></td>");
		tr.append(td);
		td.addClass("role");
		var edit = editBox(vodmlref, literal);
		td.append(edit);
	};
	
	function editBox(vodmlref, literal)
	{
		var edit=null;
		if(vodmlref == "ivoa:boolean") {
			edit=jQuery("<select style='width:100%'><option>false</option><option>true</option></select>");
		}  
		else {
			var type = models.find(vodmlref);
			var vodmlType = type.nodeName;
			if(vodmlType == 'enumeration') {
				edit=jQuery("<select style='width:100%'></select>");
				jQuery.each(jQuery(type).find(">literal>name"), function() {
					var opt = jQuery("<option>"+jQuery(this).text()+"</option>");
					edit.append(opt);
				});
			} else {
				// see if type has base class
				var _extends = jQuery(type).find(">extends");
				if (_extends != null && _extends.length > 0) {
					var vodmlref = jQuery(_extends).find(">vodml-ref").text();
					edit = editBox(vodmlref, literal);
				} else { // default
					edit = jQuery("<input style='width:95%'></input>");
//					edit = jQuery("<textarea rows=1 style='width:95%'></textarea>");
				}
			}
		};
		if(edit == null)
		{
			edit = jQuery("<input style='width:95%'></input>");
		};
		edit.addClass("editBox");
		if(typeof literal !== 'undefined' && literal != null)edit.val(literal);
		return edit;
	}
	function findAllRoles(type, cache) {
		// find base class and get its roles first
		var _extends = jQuery(type).find(">extends");
		if (_extends != null && _extends.length > 0) {
			var vodmlref = jQuery(_extends).find(">vodml-ref").text();
			var supertype = models.find(vodmlref);
			findAllRoles(supertype, cache);
		} else if(type.nodeName == "objectType") // implicit base class 
		{
			var model = jQuery(type).closest('model');
			if(jQuery(model).find(">name").text() != "vo-dml"){
				var supertype = models.find("vo-dml:ObjectInstance");
				findAllRoles(supertype, cache);
			}
		};
		jQuery(type).find(">attribute").each(function() {
			addRole2Cache($(this), cache);
		});
		jQuery(type).find(">reference").each(function() {
			addRole2Cache($(this), cache);
		});
		jQuery(type).find(">composition").each(function() {
			addRole2Cache($(this),cache);
		});
	};
	
	function findAllSubsets(type, subsetCache) {
		jQuery(type).find(">constraint").each(function() {
			var constraint = $(this);
			var role = constraint.find(">role>vodml-ref").text();
			var datatype= constraint.find(">datatype>vodml-ref").text()
			var e = subsetCache[role];
			if(e == null){
				subsetCache[role] = datatype;
			}
		});
		var _extends = jQuery(type).find(">extends");
		if (_extends != null && _extends.length > 0) {
			var vodmlref = jQuery(_extends).find(">vodml-ref").text();
			var supertype = models.find(vodmlref);
			findAllSubsets(supertype, subsetCache);
		} 
	};

	function prepareRoles(cache, subsetsCache, typeVodmlref)
	{
		
		var cleaned = new Array();
		jQuery.each(cache,function(){
			var vodmlref = this;
			var isSubsetted = false;
			jQuery.each(cache,function(){
				var role = models.find(this);
				jQuery.each(jQuery(role).find(">subsets>vodml-ref"), function(){
					if(jQuery(this).text() == vodmlref) isSubsetted = true;						
				});
			});
			if(isSubsetted) {
				return;
			}
			var subset=subsetsCache[vodmlref];
			var role = busObj4role(vodmlref, subset);
			if(vodmlref == "vo-dml:ObjectInstance.CONTAINER") {
				var	container = models.findContainer(typeVodmlref);
				if(container == null) return true;
				else role.info.datatype = container;
			} 
			var mult = "["+role.info.minOccurs+".."+role.info.maxOccurs+"]";


			role["title"] = " - " + role.info.name + " : " 
			+ role.info.datatype + "  "+mult;
//			role["title"] = "&nbsp;- " + role.info.name + " : " 
//			+ role.info.datatype + "&nbsp;&nbsp;"+mult+"&nbsp;";

			cleaned.push(role);
		});
		return cleaned;
	}
	
	
	function addRole2Cache(role, cache)
	{
		var vodmlid = role.find(">vodml-id").text();
		var vodmlref = role.closest("model").find(">name").text() + ":" + vodmlid;
		cache.push(vodmlref);
	};

	function vodmlref4role(role)
	{
		var vodmlid = role.find(">vodml-id").text();
		var vodmlref = role.closest("model").find(">name").text() + ":" + vodmlid;
		return vodmlref;
	};
	
	function busObj4role(vodmlref, subset)
	{
		var role = models.find(vodmlref);
		var vodmltype = role.nodeName;
		role = jQuery(role);
		var info = new Object();

		var vodmlid = role.find(">vodml-id").text();
		var vodmlref = role.closest("model").find(">name").text() + ":" + vodmlid;
		var name = role.find(">name").text();
		var description = role.find(">description").text();
		var dt = role.find(">datatype>vodml-ref").text();
		if(subset != null){
			dt=subset;
		}
		var minO = role.find(">multiplicity>minOccurs");
		if(minO != null){
			minO=minO.text();
		} else { minO = 0;}
		var maxO = role.find(">multiplicity>maxOccurs");
		if(maxO != null){
			maxO=maxO.text();
		} else { maxO = 1;}
		
		info["vodmlref"] = vodmlref;
		info["vodmltype"] = vodmltype;
		info["name"] = name;
		info["description"] = description;
		info["datatype"] = dt.trim();
		info["minOccurs"] = minO;
		info["maxOccurs"] = maxO;
		var busObj = new Object();
		busObj["info"] = info;
		return busObj;
	}
	var addRole = function(roleBusObj, tbl, id, node, literal, arraysize) {
		if(arraysize == null) arraysize=1;
		var role = roleBusObj.info;
		var tr = jQuery("<tr class='role'></tr>");
		tbl.append(tr);

		var span = "<span title='"+JSON.stringify(role,null,"\t")+"'>";
		var text = span+roleBusObj.title+"</span>";
		
		var roletd = jQuery("<td colspan=2>"+text+"</td>");
		tr.append(roletd);
		var t = models.find(role.datatype);

		roletd.addClass("role");
		var menu = [ {
			'Show info (JSON)' : function(menuItem, menu) {
				showRoleInfo(roleBusObj.info);
			}
		} ];
		var td = jQuery("<td></td>");
		td.addClass("sourceendpoint");
		tr.append(td);
		tr.addClass("as_link");
		if(role.vodmltype == "attribute")
		{
			for(var i = 0; i < arraysize; i++) addAttributeEndpoint(roleBusObj, td, id);
			if(role.maxOccurs > 1 || role.maxOccurs == -1) {
				menu.push({
					'Add endpoint' : function(menuItem, menu) {
						addAttributeEndpoint(roleBusObj, td, id);
					}});
			} else {
				if(t.tagName.toLowerCase() == "primitivetype" 
				||	t.tagName.toLowerCase() == "enumeration")
					{
				menu.push({
					'As constant' : function(menuItem, menu) {
						asConstant(role, tr, roletd, id, node);
					}});
				menu.push({
					'As link' : function(menuItem, menu) {
						asLink(role, tr, roletd, id, node);
					}});
				}
			};
			if(literal != null) asConstant(role, tr, roletd, id, node, literal);
		} 
		else if(role.vodmltype == "reference"){
			for(var i = 0; i < arraysize; i++) addReferenceEndpoint(roleBusObj, td, id);
			if(role.maxOccurs > 1 || role.maxOccurs == -1){
				menu.push({
					'Add endpoint' : function(menuItem, menu) {
						addReferenceEndpoint(roleBusObj, td, id);
					}});
			}
		}
		else if(role.vodmltype == "composition")
			addCompositionEndpoint(roleBusObj, td, id);
		roletd.contextMenu(menu, {});
	};
	
	function asConstant(role, tr, roletd, id, node, literal)
	{
		// TBD check that only primitive type can be used as constant
		if(tr.hasClass("as_constant")) return;
		tr.removeClass("as_link");
		tr.addClass("as_constant");
		var eptd = jQuery(tr).find("td:last");
		// remove outgoing link if one exists
		var ep = eptd.find("div.endpoint");
		// todo also remove endpoint circle
		jsPlumb.detachAllConnections(ep);
		// hide the dot, which otherwise shows up floating in the screen
		jsPlumb.selectEndpoints({element:$(ep)}).setVisible(false);   
		// hide the whole cell
		eptd.hide();  
		
		roletd.attr("colspan",3);
		var eb = editBox(role.datatype, literal);
		eb.addClass("as_constant_value");
		eb.attr("vodmlref",role.vodmlref);
		roletd.append(eb);
		jQuery(eb).focus();
		try {
			jsPlumb.repaintEverything();
		}catch(exc){
			logConsole.log("Caught and ignored exception "+exc.message,"asConstant");
			throw exc;
		}
		jsPlumb.recalculateOffsets(node);
	}
	function asLink(role, tr, roletd, id, node)
	{
		if(tr.hasClass("as_link")) return;
		else if(tr.hasClass("as_constant"))
		{
			tr.removeClass("as_constant");
		}
		tr.addClass("as_link");

		roletd.attr("colspan",2);
		var eb = jQuery(roletd).find(".as_constant_value");
		eb.remove();
		var ep = jQuery(tr).find("td:last");
		ep.show();
		var epdiv = ep.find("div.endpoint");
		jsPlumb.selectEndpoints({element:$(epdiv)}).setVisible(true);   

		try {
			jsPlumb.repaintEverything(); // NB seems better than repaint(node)
		}catch(exc){
			logConsole.log("Caught and ignored exception "+exc.message,"asConstant");
			throw exc;
		}
		jsPlumb.recalculateOffsets(node);
	}
	
	function newRoleEndpoint(td,vodmlref,objectId,datatype,rank)
	{
		var epNode = newIdentifiedNode("endpoint");
		td.append(epNode);
		if(rank >= 1 && !td.hasClass("as_array")){
			td.addClass("as_array");
		} else {//if(rank == 1 && td.hasClass("as_array")){
			rank=0;
			td.removeClass("as_array"); // this should not happen here, only in a "removeEndpoint"
		}

		jQuery(epNode).attr({vodmlref:vodmlref,objectId:objectId,datatype:datatype,rank:rank});
		return epNode;
}
	function addAttributeEndpoint(attr, td, objectId) {
		var rank = jQuery(td).children("div").length;
		var epNode = newRoleEndpoint(td,attr.info.vodmlref, objectId,attr.info.datatype, rank);
		var datatype = models.find(attr.info.datatype);
		var connectorType = datatype.nodeName;
		var sp = roleEndpoint(attr, connectorType, objectId, rank);
		return add_jsPlumb_Endpoint(epNode, sp);
	};
	function add_jsPlumb_Endpoint(epNode, sp){
		var classes_pre = jQuery(epNode).attr("class");
		
		var ep = jsPlumb.addEndpoint(epNode, sp);
		ep.setElementId(jQuery(epNode).attr("id"));
		
		var classes_post = jQuery(epNode).attr("class");;
		if(classes_pre != null && false){
			alert(classes_pre +"  ==>> "+ classes_post);
		}
		
		return ep;
	}
//	function add_jsPlumb_Endpoint(epNode, sp){
//		var ep = jsPlumb.addEndpoint(epNode, sp);
//		ep.setElementId(jQuery(epNode).attr("id"));
//		var classes = jQuery(ep).attr("class");
//		if(true)alert(classes);
//		return ep;
//	}
	function addReferenceEndpoint(ref, td, objectId) {
		var rank = jQuery(td).children("div").length;
		var epNode = newRoleEndpoint(td,ref.info.vodmlref, objectId,ref.info.datatype,rank);
		var sp = roleEndpoint(ref, "reference", objectId,0);
		return add_jsPlumb_Endpoint(epNode, sp);
	};
	function addCompositionEndpoint(col, td, objectId) {
		var rank = jQuery(td).children("div").length;
		var epNode = newRoleEndpoint(td,col.info.vodmlref, objectId,col.info.datatype,rank);
		var sp = roleEndpoint(col, "composition", objectId,rank);
		return add_jsPlumb_Endpoint(epNode, sp);
	};
	this.showInfo = function(vodmlref) {
		alert("vodmlref = " + vodmlref);
	};
	
// ~~~ show tables
	this.showTable = function(table, position, id) {
		var node = newTableNode(table, id);
		var id = node[0].id;
		mapContainer.append(node);
		jsPlumb.draggable(node);
		node.addClass("rootnode");
		node.addClass("tableNode");
		if(position != null) {
			var left = position.x-mapContainer.position().left+mapContainer.scrollLeft();
			var top = position.y-mapContainer.position().top+mapContainer.scrollTop();
			node.css("left",left+"px");
			node.css("top",top+"px");
		}

// var tbl = jQuery("<table style='border:2px solid red;width:100%'></table>");
		var tableNode = jQuery("<table></table>");
		tableNode.addClass('node');
		node.append(tableNode);
		addTableTitle(table, id, tableNode);
		node.animate(tableNode.outerHeight(true));
		logConsole.log("Adding table instance "+node[0].id, that.name);
		// add columns
		tablesManager.loadTable(table, function(){
			addColumns(table, id, node, tableNode);
			addParams(table, id, node, tableNode);
		});
		addTableMenu(node,id);
		node.animate(tableNode.outerHeight(true));
		logConsole.log("Added table "+ table.name, that.name);
	};
	function addTableMenu(node, id)
	{
		var table = tables[id];
		var menu = [ {
			'Show info' : function(menuItem, menu) {
				showTableInfo(table);
			},
			'Delete' : function(menuItem, menu) {
				removeTableConfirm(id);
			}
		} ];
		node.contextMenu(menu, {});
	};
	function showTableInfo(table)
	{
		// TODO? check table is a SourceTable?
		var state = table.source_table.getState();
		alert(JSON.stringify(state,null,"\t"));
	};
	var addColumns = function(table, id, node, tbl) {
		if(table.columns == null){
			alert("no columns found in table");
			return;
		}
		jQuery.each(table.columns, function() {
			addColumn(this, id, node, tbl);
		});
	};
	function addTableTitle(table, tableId, tbl) {
		var tr = jQuery("<tr></tr>");
		tbl.append(tr);
		var td = jQuery("<td ></td>");
		td.addClass("targetendpoint");
		tr.append(td);
		var tableEPNode = newIdentifiedNode("endpoint");
//		tableEPNode.addClass("endpoint");
		td.append(tableEPNode);
		var sp = tableEndpoint(tableId);
		add_jsPlumb_Endpoint(tableEPNode, sp);
		var th = jQuery("<td>"+table.name+"</td>");
		th.addClass("titleNode");
		tr.append(th);
	};

	
	function addColumn(column, tableId, node, tbl) {
		var tr = jQuery("<tr class='role'></tr>");
		tbl.append(tr);
		var td = jQuery("<td ></td>");
		td.addClass("targetendpoint");
		tr.append(td);
		var columnEPNode = newIdentifiedNode("endpoint");
//		columnEPNode.addClass("endpoint");
		td.append(columnEPNode);
		var sp = columnEndpoint(column, tableId);
		add_jsPlumb_Endpoint(columnEPNode, sp);

		var datatype = column.datatype;
		if(datatype == null) datatype = column.xtype;
		var arraysize="";
		if(column.arraysize != null)arraysize=" ["+column.arraysize+"]"
			
		var info = column.getState();
		var span = "<span title='"+JSON.stringify(info,null,"\t")+"'>";
		var text = span+"&nbsp;- " + column.name + " : " + datatype + arraysize+"</span>";

		td = jQuery("<td>" + text + "</td>");
		td.addClass("role");
		addColumnMenu(td,column);
// td.hover(function(){jQuery(this).append("<span> HOVERING!!!</span>");});
		tr.append(td);
	};
	function addColumnMenu(node, column)
	{
		var menu = [ {
			'Show info' : function(menuItem, menu) {
				showColumnInfo(column);
			}
		} ];
		node.contextMenu(menu, {});
	};

	function showColumnInfo(column)
	{
		var state = column.getState();
		alert(JSON.stringify(state,null,"\t"));
	};

	var addParams = function(table, id, node, tbl) {
		if(table.params == null) return;
		jQuery.each(table.params, function() {
			addParam(this, id, node, tbl);
		});
	};
	function addParam(param, tableId, node, tbl) {
		var tr = jQuery("<tr class='param'></tr>");
		tbl.append(tr);
		var td = jQuery("<td ></td>");
		td.addClass("targetendpoint");
		tr.append(td);
		var paramEPNode = newIdentifiedNode("endpoint");
//		paramEPNode.addClass("endpoint");
		td.append(paramEPNode);
		var sp = columnEndpoint(param, tableId);
		add_jsPlumb_Endpoint(paramEPNode, sp);
		
		td = jQuery("<td>&nbsp;- " + param.name + " : " + param.datatype + "</td>");
		td.addClass("role");
		addParamMenu(td,param);
// td.hover(function(){jQuery(this).append("<span> HOVERING!!!</span>");});
		tr.append(td);
	};
	
	function addParamMenu(node, param)
	{
		var menu = [ {
			'Show info' : function(menuItem, menu) {
				showParamInfo(param);
			}
		} ];
		node.contextMenu(menu, {});
	};

	function showParamInfo(param)
	{
		var state = param.getState();
		alert(JSON.stringify(state,null,"\t"));
	};

	//==================================================================
	// return the current state of the mapper view as an object
	// to be serialized or ...
	//==================================================================
	this.getState = function()
	{
		var state = new Object();
		var ms = new Array();

		var scrollLeft = mapContainer.scrollLeft();
		var scrollTop = mapContainer.scrollTop();

		state["stateId"] = date;
		state["counter"] = counter;
		state["models"] = ms;
		jQuery.each(models.vodml.models_url,function(key,value){
			var ml = new Object();
			ml["url"] = key;
			ml["name"] = value["name"];
			ms.push(ml);
		});
		var ts = new Object();
		state["tables"] = tablesManager.tablesTreeView.getState();
		var mapper = new Object();
		state["mapper"] = mapper;
		var os = new Array();
		jQuery.each(objects, function(){
			var o = new Object();
			o["id"] = this.id;
			o["vodmlref"] = this.vodmlref;
			o["vodml-path"] = this.path;
			o["vodmltype"] = this.vodmltype;
			var node = jQuery("#"+o.id);
			o["collapsed"] = node.hasClass("collapsed");
			var pos = node.position();
			o.position={"left":pos.left+scrollLeft,"top":pos.top+scrollTop};
			if(this.vodmltype == "primitiveType" ||
					this.vodmltype == "enumeration")
			{
				var val = jQuery(node).find(".editBox");
				if(val.length > 0)	o["value"] = val[0].value;
				else o["value"] = "";
			} else {
				// TODO find as_constant attributes and their values.
				o.literals = new Array();
				jQuery.each(jQuery(node).find(".as_constant"), function()
				{
					var val = jQuery(this).find(".editBox");
					if(val.length > 0)
					{
						var attr = new Object();
						attr.vodmlref = val[0].getAttribute("vodmlref");
						attr.value =  val[0].value;
						o.literals.push(attr);
					}
				});
				o.arrays = new Array();
				jQuery.each(jQuery(node).find(".as_array"), function()
				{
					var val = jQuery(this).find(".endpoint");
					if(val.length > 1)
					{
						var attr = new Object();
						attr.vodmlref = val[0].getAttribute("vodmlref");
						attr.length =  val.length;
						o.arrays.push(attr);
					}
				});
			}
			os.push(o);
		});
		mapper["objects"] = os;
		var ts = new Array();
		jQuery.each(tables, function(){
			var t = new Object();
			t.id = this.id;
			var node = jQuery("#"+t.id);
			var pos = node.position();
			t.position={"left":pos.left+scrollLeft,"top":pos.top+scrollTop};
			t.source = this.source_table.getState();
			ts.push(t);
		});
		mapper["tables"] = ts;
		
		var maps = new Array();
		var allConnections = jsPlumb.getConnections();
		jQuery.each(allConnections, function() {
			var conn = this;
			var source = conn.endpoints[0];
			var target = conn.endpoints[1];
			var map = new Object();
			map["from"] = source.getParameters();
			map["to"] = target.getParameters();
			maps.push(map);
		});
		mapper["maps"] = maps;
		return state;
	};
	
	
	// XML handling
	function newElement(doc, parent, name)
	{
		var el = doc.createElement(name);
		parent.appendChild(el);
		return el;
	};
	function addTextChild(doc, parent, name, value)
	{
		var el = newElement(doc, parent, name);
		el.textContent = value;
	}
	
	// next required to repaint endpoints in proper position
	 $(window).resize(function() {
		 jQuery.each(mapContainer.find(".rootnode"),function(){
			 jsPlumb.recalculateOffsets(jQuery(this));
		 });
		 jsPlumb.repaintEverything();
	});
	 
	 
	 //--- functions to draw connections programmatically based on information in a mapping state
		this.drawConnection = function(con){
			var fromEP = findEndpoint(con.from);
			var toEP = findEndpoint(con.to);
			if(fromEP != null && toEP != null)
				// TODO check compatibility, in case tables/models have changed??
				var connection = jsPlumb.connect({
					source:fromEP, 
					target:toEP,
					connectorStyle:fromEP.connectorStyle,
					connector: fromEP.connector,
					beforeDetach:function(conn) { 
						return true; 
					}
				});
				if(connection != null){
					connection.bind("click",function(conn){
						confirmDialogue("do you want to delete this connection?", function(){		
							jsPlumb.detach(conn);
						});
					});
				}
		};

		function findEndpoint(mapend){
			var isObject = (mapend.objectId != null);
			return isObject?findObjectEndpoint(mapend):findTableEndpoint(mapend);
		}
		
		// pass in a set of key-value pairs 
		function searchEndpoints(constraints){
			var ep = null;
			jsPlumb.selectEndpoints().each(function(endpoint){
				var ok = true;
				var info = endpoint.getParameters();
				jQuery.each(constraints, function(key, value){
					if(info[key] != value){
						ok = false;
						return false;
					}
				});
				if(ok){
					ep = endpoint;
					return false;
				}
			});
			if(ep == null){
				alert("Unable to find endpoint for connection using constraints <br/>"+JSON.stringify(constraints));
			};			
			return ep;
		}
		
		
		function findObjectEndpoint(mapend){
			var ep = null;
			var rank = (mapend.rank != null?mapend.rank:0);
			if(mapend.role != null) {
				ep = searchEndpoints({"objectId":mapend.objectId,"vodmlref":mapend.role.vodmlref,"rank":rank});
			} else {
				ep = searchEndpoints({"objectId":mapend.objectId,"vodmlref":mapend.type.vodmlref, "connectorType":mapend.connectorType});
			}
			return ep; 
		}
		function findTableEndpoint(mapend){
			var ep = null;
			if(mapend.column != null) {
				ep = searchEndpoints({"tableId":mapend.tableId,"name":mapend.column.name});
			} else {
				ep = searchEndpoints({"tableId":mapend.tableId,"connectorType":"table"});
			}
			return ep;
		}

};

//////////////////////////////////////////////////////////////////////////

