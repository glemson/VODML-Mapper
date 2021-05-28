
var Config = function(){
	var tablesDiv;
	var modelsDiv;
	var modelsTreeDiv;
	var mapperDiv; 
	var tablestreediv;
	var loadTAPButton;
	var clearAllButton;
	var loadstatesButton;
	var savestateButton;
	var loadVOTableButton;
	var votableurlField;
	var tapschemaField;
	var logConsole;
	var mappingTab;
	var mappingConsole;
	var loadIVOAModelButton;
	var loadIVOAModelSelect;
	var loadCustomModelButton;
	var loadCustomModelInput;
	var loadVizieRButton;
	var vizierField;
};	
var icons = {
		"tableIcon":"css/images_jstree/Database-Table-icon-16.png",
		"objectTypeIcon":"css/images_jstree/Document-icon-16.png",
		"dataTypeIcon":"css/images_jstree/Document-Blank-icon-16.png",
		"primitiveTypeIcon":"css/images_jstree/Document-Blank-icon-16.png",
		"enumerationIcon":"css/images_jstree/Document-Blank-icon-16.png",
		"ModelsIcon":"css/images_jstree/_drive.png",
		"tapendpointIcon" : "css/images_jstree/Database-Active-icon-16.png",
		"votableIcon" : "css/images_jstree/Generate-tables-icon-16.png",
		"vodmlModelIcon" :"css/images_jstree/3D-objects-icon-16.png",//Aha-Soft-Software-Objects.ico"
		"vizierIcon" : "css/images/vizier_tiny.gif",
		"ivoaIcon":"css/images/ivoa_icon.jpg",
		"loadStateIcon" :"",
		"deleteStateIcon":"",
		"publishStateIcon":""
};
var LogConsole = function(consoleId)
{
	var that = this;
    var logconsole = jQuery("#"+consoleId);
    // component indicates the component on the GUI that provoked the log text
    this.log = function(text, component)
    {
    	var time = getTimestamp();
    	logconsole.append("["+time+" -- "+component+"] "+text+"<br/>").show();
    };
    function clear()
    {
    	logconsole.text("");
    };
    function format2(v)
    {
    	if(v < 10) return "0"+v;
    	else return ""+v;
    }
    function format3(v)
    {
    	if(v < 10) return "00"+v;
    	else if(v < 100) return "0"+v;
    	else return ""+v;
    }
    function getTimestamp()
    {
    	var currentdate = new Date(); 
    	var date = currentdate.getDate();
    	if(date < 10) date = "0"+date;
    	var datetime = currentdate.getFullYear() + "-"
    	                + format2(currentdate.getMonth()+1)  + "-" 
    	                + format2(currentdate.getDate()) + "::"  
    	                + format2(currentdate.getHours()) + ":"  
    	                + format2(currentdate.getMinutes()) + ":" 
    	                + format2(currentdate.getSeconds())+"."
    	                + format3(currentdate.getMilliseconds());
    	return datetime;
    }
    
	var menu = [ {
		'Clear' : function(menuItem, menu) {
			clear();
		}
	} ];
	logconsole.contextMenu(menu, {});
};
var logConsole;

var IVOA_Models = {
		"source" : {
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/SourceDM/vo-dml/Source-0.1.vo-dml.xml",
			"html":"http://volute.g-vo.org/svn/trunk/projects/dm/SourceDM/vo-dml/Source-0.1.html"
		},
		"photdm-alt":{
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/vo-dml-org/models/photdm-alt/PhotDM-alt.vo-dml.xml",
			"html":""
		},
		"sample" : {
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/vo-dml/models/sample/sample/vo-dml/Sample.vo-dml.xml",
			"html":""
		},
		"ivoa" : {
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/vo-dml/models/ivoa/vo-dml/IVOA-v1.0.vo-dml.xml",
			//"http://ivoa.net/xml/VODML/IVOA-v1.vo-dml.xml",
				"html":""
		},
		"filter" : {
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/vo-dml/models/sample/filter/vo-dml/Filter.vo-dml.xml",
			"html":""
		},
		"caom2":{
			"xml":"http://volute.g-vo.org/svn/trunk/projects/dm/vo-dml-org/models/caom2/cadc/CAOM2.vo-dml.v1.xml",
			"html":""
		},
		"vo-dml":{
			"xml":"http://localhost:8080/VODML-Mapper/vo-dml/VO-DML.vo-dml.xml",
			"html":""
		}
};

var LoaderURLRoot = "modelLoader";
var LoaderURL = LoaderURLRoot+"?action=loadVO-DML&url=";
var listIVOAModelsURL = LoaderURLRoot+"?action=listIVOAModels";
var LoadVOTABLE = "registry?action=loadVOTable&";
var LoadPrivateMapping = "registry_private?action=FIND_MAPPING&isPublic=false";
var LoadVizieR = "modelLoader?action=loadVizieR&catalogue=";
var QueryStatesURL = "modelLoader";
var LoadPublicMapping = "registry?action=FIND_MAPPING&";
var UploaderURL = "registry_private";
var refreshStatesURL=UploaderURL+"?LISTSTATES=true";

var VODMLMapper = (function() {
//var VODMLMapper = {

	var BaseController = function(config){
		var that = this;
		logConsole = new LogConsole(config.logConsole);
		var models = new ModelsManager();
		var modelsTreeView = new ModelsTreeView(config.modelsTreeDiv, models);
		var tablesManager = new TablesManager(config);

		var mapperController = new MapperController(config, models, tablesManager, this);

		var stateLoader = new StateLoader(models, modelsTreeView, tablesManager, mapperController);
		var isLoadingState = false;
		
		// clearAll called form clearAll button
//		jQuery("#"+config.clearAllButton).click(function(){clearAll();});
//		jQuery("#"+config.savestateButton).click(function(){saveState();});
//		jQuery("#"+config.loadstatesButton).click(function(){refreshStates();});
		// empty all models, tables, maps. reinitialize models.
		function clearAll()
		{
			stateLoader.clearAll();
		};
		function saveState()
		{
			logConsole.log("Saving state","BASECONTROLLER:saveState");
			mapperController.saveState();
		};
		this.getCurrentState = function(){
			return stateLoader.getCurrentState();
		};
		this.setCurrentState = function(state){
			return stateLoader.setCurrentState(state);
		};
		this.loadMapping = function(id, isPublic)
		{
			isPublic = typeof isPublic !== 'undefined'?isPublic:true;
			var url;
			if(isPublic) {
				url=LoadPublicMapping+"&_id="+encodeURIComponent(id);
			} else {
				url=LoadPrivateMapping+"&_id="+encodeURIComponent(id);
			}
			jQuery.ajax({
				url:url,
				async:false,
				dataType:"json",
				success: function(result) {
					if(result == null){
						alert("No result returned trying to load mapping. Message = "+message);
					} else {
						if(result["result"] != "ok"){
							alert("Problem retrieving state:" +result["message"]);
						} else {
							that.loadState(result.map);
						}
					}
				},
				error: function(error){
					alert("Error while trying to refresh list of states. Message:"+error.message);
				}
			});
		};
		this.loadState = function(state) {
			isLoadingState = true; // do not react to notifications
			stateLoader.loadState(state);
			isLoadingState = false; 
			// ok to set this here, as it mainly concerns models loading
			// which is done in sync mode in the stateloader. Otherwise the stateloader would have to
			// signal completion or something like that
		};
		
		// add ...
		jQuery("#"+config.loadIVOAModelButton).click(function(){loadIVOAModel();});
		function loadIVOAModel()
		{
			var elt = document.getElementById(config.loadIVOAModelSelect);
			var ep= elt.options[elt.selectedIndex].text;
			models.loadModel(ep,IVOA_Models[ep]['xml']);
		};

		jQuery("#"+config.loadCustomModelButton).click(function(){loadCustomModel();});
		function loadCustomModel()
		{
			var elt = document.getElementById(config.loadCustomModelInput);
			var ep= elt.value;
			models.loadModel(null,ep);
		};
		jQuery("#"+config.loadVOTableButton).click(function(){loadVOTable();});
		function loadVOTable()
		{
			var url = document.getElementById(config.votableurlField).value;
			tablesManager.loadVOTable(url);
		};
				
		jQuery("#"+config.loadVizieRButton).click(function(){loadVizieRSources();});
		function loadVizieRSources()
		{
			var names = document.getElementById(config.vizierField).value;
			tablesManager.loadVizieR(names);
		};
		
		this.init = function(){
			initIVOAModels();
		};
		function enableModelsLoader(){
			jQuery("#"+config.loadIVOAModelButton).removeAttr("disabled");          
			jQuery("#"+config.loadCustomModelButton).removeAttr("disabled");
		};
		function disableModelsLoader(){
			jQuery("#"+config.loadIVOAModelButton).attr("disabled","disabled");
			jQuery("#"+config.loadCustomModelButton).attr("disabled","disabled");
		};

		function initIVOAModels()
		{
			models.clearAll();
			jQuery.ajax({
				url:listIVOAModelsURL,
				async:true,
				dataType:"json",
				accepts: {
			        json: 'application/json'
			    },
				success: function(ivoaModels) {
					if(ivoaModels == null ) {
						that.notifyLoadModelError("No VO-DML model found for model name "+name+" at url "+url+", can not initialise model.");
						return;
					}
					IVOA_Models = ivoaModels; //JSON.parse(ivoaModels); //['IVOA_Models'];
					
					// TODO update dropdown loadIVOAModelSelect
				    var loadIVOAModelSelect = document.getElementById('loadIVOAModelSelect');
				    var o;
				    for(o in loadIVOAModelSelect.options){//}.length - 1 ; i >= 0 ; i--)
				    	loadIVOAModelSelect.remove(0);
				    };

				    var names=[];
				    for (var name in IVOA_Models){
				    	if (IVOA_Models.hasOwnProperty(name)) {
				    		if(name != "vo-dml") names.push(name)
				    	}
				    }
				    names.sort();
				    for (var i in names){
				        var opt = document.createElement('option');
				        opt.value = names[i];
				        opt.innerHTML = names[i];
				        loadIVOAModelSelect.appendChild(opt);
				    }
				},
				error: function(error){
					alert(
							"an error occurred while querying for list of IVOA models at "+listIVOAModelsURL+": "
							+ error.status+" "+error.statusText);
				}
			});

//			
//			that.loadModel("filter",IVOA_Models["filter"]);
		}
		this.loadModel = function(name,url)
		{
			models.loadModel(name, url);
		};
		this.loadTables = function(url)
		{
			models.loadTables(url);
		};
		/**
		 * listen to the model
		 */
		var mlist = new ModelsListener({
			loadModelStarted : function(name, url)
			{
				disableModelsLoader();
				logConsole.log("Starting loading model ["+name+"] from "+url,"BASECONTROLLER");
			},
			loadModelError : function(message)
			{
				enableModelsLoader();
				logConsole.log("Error loading model:"+message,"BASECONTROLLER");
				alert("Error loading model:"+message);
			},
			loadModelEnded : function(newModels,name)
			{
				enableModelsLoader();
				if(!isLoadingState) modelsTreeView.addModels(newModels);
				logConsole.log("Done loading model ["+name+"]","BASECONTROLLER");
			}
		});
		models.addListener(mlist);
	
		// view
		/**
		 * listen to the model
		 */
		var vtlist = new ModelsTreeViewListener({
			typeSelected : function(vodmlref, position)
			{
				mapperController.showType(vodmlref, position, null);
			},
			clearModels : function(){
				models.clearAll();
				mapperController.clearAll();
			},
			loadIVOAModel : function(modelName)
			{
				var model= IVOA_Models[modelName];
				if(model == null) {
					alert("Unknown IVOA model name '"+modelName+"' requested");
					return;
				}
				var url = model['xml']; 
				if(url != null) {
					that.loadModel(modelName, url);
				} else {
				}
			},
			treeIsLoaded : function(){
				enableModelsLoader();
			}
		});
		modelsTreeView.addListener(vtlist);

		var tablesListener = new TablesTreeViewListener({
			tableDropped : function(table, position) {
				mapperController.showTable(table, position);
			},
			tablesTreeLoaded : function(){}
		});
		tablesManager.tablesTreeView.addListener(tablesListener);
		//---------------------------------------------------------------------------
		// TODO implement zoom functionality properly.
		// 'zoom' not supported properly on all browsers
		// and does not work well this way with jQuery UI Layout.
		jQuery("#zoomin").click(function(){
			zoomin();
		});
		jQuery("#zoomout").click(function(){
			zoomout();
		});
		var zoomlevel = 1;
		function zoomin()
		{
			zoomlevel = zoomlevel*1.2;
			jQuery("#"+config.mapperDiv).animate({ 'zoom': zoomlevel }, 0);
		}
		function zoomout()
		{
			zoomlevel = zoomlevel/1.2;
			jQuery("#"+config.mapperDiv).animate({ 'zoom': zoomlevel }, 0);
		}
		//---------------------------------------------------------------------------
		
	};

	//===============================================
	//    ModelsTreeView
	//===============================================
	var ModelsTreeView = function(modelstreediv, modelsManager){
		var that = this;
		modelstreediv="#"+modelstreediv;
		this.modelsTree = jQuery(modelstreediv);
		var treeIsInitialized = false;
		jQuery.jstree._themes = "themes/";
		this.rootNode;

		/**
		 * who is listening to us?s
		 */
		var listeners = new Array();
		/**
		 * add a listener to this model
		 */
		this.addListener = function(list){
			listeners.push(list);
		};
		/////////////////////////
		this.notifyTypeSelected = function(vodmlref, position){
			jQuery.each(listeners, function(i){
				listeners[i].typeSelected(vodmlref, position);
			});
		};
		this.notifyAddNewModel = function(){
			jQuery.each(listeners, function(i){
				listeners[i].addNewModel();
			});
		};
		this.notifyClearModels = function(){
			jQuery.each(listeners, function(i){
				listeners[i].clearModels();
			});
		};
		this.notifyLoadIVOAModel = function(modelName){
			jQuery.each(listeners, function(i){
				listeners[i].loadIVOAModel(modelName);
			});
		};
		this.notifyModelsTreeLoaded = function() 
		{
			jQuery.each(listeners, function(i){
				listeners[i].treeIsLoaded();
			});
		};
		//=================================
		// add new model, specified by xml
		//=================================
		function refresh(){
			// load all models in the ModelsManager
			if(!treeIsInitialized) {
				alert("Unable to refresh models yet, tree not yet initialized");
				return;
			};
			that.addModels(modelsManager.vodml.getModels());
		};
		this.addModels = function(newModels)
		{
			if(!treeIsInitialized) {
				alert("Unable to add models yet, tree not yet initialized");
				return;
			};
			for(var i = 0; i < newModels.length; i++)
			{
				var model = newModels[i];
				addModel(model);
			}
		};
		function addModel(model)
		{
			var modelId = id4vodmlref(model.name);
			var data = {
				"data":{"title":model.name,"icon":icons.vodmlModelIcon}, 
				"attr" :{ "id" : modelId, "rel" : "model","vodml":model,"name":model.name,
					"location":model.location}
			};
			var rootNode = jQuery("#ROOT__NODE");
			var modelNode = that.modelsTree.jstree("create_node", rootNode, "inside",data);
			for(var key in model.packages) {
				var p = model.packages[key];
				addPackage(p,modelNode);
			}
			for(var key in model.objectTypes) {
				var ot = model.objectTypes[key];
				addObjectType(ot, modelNode);
			};
			for(var key in model.dataTypes) {
				var dt = model.dataTypes[key];
				addDataType(dt, modelNode);
			};
			for(var key in model.primitiveTypes) {
				var dt = model.primitiveTypes[key];
				addPrimitiveType(dt, modelNode);
			};
			for(var key in model.enumerations) {
				var dt = model.enumerations[key];
				addEnumeration(dt, modelNode);
			};
		};
		
		function addPackage(p,parent)
		{
			var vodmlref=p.vodmlref;
			var pId=id4vodmlref[vodmlref];
			var data = {
					"data":p.name, 
					"attr" :{ "id" : pId, "rel" : "package", "vodml":p,"vodml-ref":vodmlref}
				};
			var pnode = that.modelsTree.jstree("create_node", parent, "inside",data);
			for(var key in p.objectTypes) {
				var ot = p.objectTypes[key];
				addObjectType(ot, pnode);
			};
			for(var key in p.dataTypes) {
				var dt = p.dataTypes[key];
				addDataType(dt, pnode);
			};
			for(var key in p.primmitiveTypes) {
				var dt = p.primmitiveTypes[key];
				addPrimitiveType(dt, modelNode);
			};
			for(var key in p.enumerations) {
				var dt = p.enumerations[key];
				addEnumeration(dt, modelNode);
			};
			for(var key in p.packages) {
				var cp = p.packages[key];
				addPackage(cp, pnode);
			};
		};
		function addObjectType(ot,parent)
		{
			var vodmlref=ot.vodmlref;
			var model = modelsManager.model4vodmlref(vodmlref);
			if(model.name == "vo-dml" && vodmlref != "vo-dml:RemoteReference" && vodmlref != "vo-dml:ORMReference") return;
			var otId=id4vodmlref(vodmlref);
			var data = {
					"data":{"title":ot.name,"icon":icons.objectTypeIcon}, 
					"attr" :{ "id" : otId, "rel" : "objectType", "vodml":ot,"vodml-ref":vodmlref}
				};
			that.modelsTree.jstree("create_node", parent, "inside",data);
		};
		function addDataType(dt,parent)
		{
			var vodmlref=dt.vodmlref;
			var dtId=id4vodmlref[vodmlref];
			var data = {
					"data":{"title":dt.name, "icon":icons.dataTypeIcon },
					"attr" :{ "id" : dtId, "rel" : "dataType", "vodml":dt,"vodml-ref":vodmlref}
				};
			that.modelsTree.jstree("create_node", parent, "inside",data);
		};
		function addPrimitiveType(dt,parent)
		{
			var vodmlref=dt.vodmlref;
			var dtId=id4vodmlref[vodmlref];
			var data = {
					"data": {"title": dt.name, "icon":icons.primitiveTypeIcon},
					"attr" :{ "id" : dtId, "rel" : "primitiveType", "vodml":dt,"vodml-ref":vodmlref}
				};
			that.modelsTree.jstree("create_node", parent, "inside",data);
		};
		function addEnumeration(dt,parent)
		{
			var vodmlref=dt.vodmlref;
			var dtId=id4vodmlref[vodmlref];
			var data = {
					"data":{"title":dt.name,"icon":icons.enumerationIcon}, 
					"attr" :{ "id" : dtId, "rel" : "enumeration", "vodml":dt,"vodml-ref":vodmlref}
				};
			that.modelsTree.jstree("create_node", parent, "inside",data);
		};
		//==========================================================
		// initialize dialogs
		jQuery("#modelloadtab_dialog").dialog({buttons:[{text:"Close", click:function(){
			jQuery(this).dialog("close");
		}}]});
		this.openLoadModelDialog = function(){
			jQuery("#modelloadtab_dialog").dialog("open");
		};

		
		function getModelTreeContextMenu(jtnode) {
			var nodetype = jtnode.attr('rel');
			var menu = {
				create: false,
				rename : false,
				remove : false,
				ccp: false
			};
			if(nodetype == 'root') {
				menu.loadIVOAModel = {
						"label" : "Load VO-DML model",
						"disabled" : false,
						"action" : function() { 
							that.openLoadModelDialog();
							}
					};
				menu.clearAll = {
						"label" : "Clear all",
						"disabled" : false,
						"action" : function() { 
							that.clearAll(); 
							that.notifyClearModels();
							},
						"_disabled" : false
					};
			} else if(nodetype == 'model'){
				var vodmlref = jtnode.attr('name');
				menu.openDoc = {
						"label":'Open documentation',
						"action" : function() { openDocument(vodmlref); } ,
						"_disabled" : false
					};
			} else {//if (nodetype == 'objectType' || nodetype == 'dataType' || nodetype == 'package') {
				var vodmlref = jtnode.attr('vodml-ref');
				menu.openDoc = {
						"label":'Open documentation',
						"action" : function() { openDocument(vodmlref); } ,
						"_disabled" : false
					};
			} 
			return menu;
		};
		

		function openDocument(vodmlref){
			var model = modelsManager.model4vodmlref(vodmlref);
			var url=model.documentation;

			var ix = vodmlref.indexOf(":");
			if(ix >=0){
				var vodmlid=vodmlref.substring(ix+1);
				url=url+"#"+vodmlid;
			}
			var w = window.open(url,"VODMLMapper_"+model.name);
			
			if (w != null){
				var title = model.name;
				if(model.title != null) title=model.title;
				w.document.title=title;
			}
//			alert("TODO open documentation for "+vodmlref+ " in model "+model);
		}

		function findNodeByVodmlref(vodmlref)
		{
			var id="#"+id4vodmlref(vodmlref).replace(/./g,"\\.");
			return jQuery(id);
		};
		function id4vodmlref(vodmlref)
		{
			return "NODE_"+vodmlref;
		};
		
		this.clearAll = function(){
			that.init(null);
		};
		// initialization of tree
		this.init = function(models){
			models = typeof models !== 'undefined'?models:null;
			treeIsInitialized = false;
			that.modelsTree.jstree({
				json_data : {
					"data" : [
					{
						"attr" : {"id":"ROOT__NODE","rel":"root", "vodmlref":""},
						"data" : {
							"title":"Models", 
							"icon" : icons.ModelsIcon
						},
						"state" : "open"
					}]},
				plugins: ["themes","ui","contextmenu","json_data","sort","types","dnd"],
				contextmenu: {
					select_node : true,
					items : function(node) {
						return getModelTreeContextMenu(node);
					}
				},
				dnd:{
					"drop_check": function(data){
						var rel = data.o.attr("rel");
						return (rel == "objectType" || rel == "dataType" || rel=="primitiveType" || rel=="enumeration");
					},
					"drop_finish": function(data){
						var vodmlref = data.o.attr("vodml-ref");
//						alert("Dropping "+vodmlref);
						var pos = {"x":data.e.clientX, "y":data.e.clientY};
						that.notifyTypeSelected(vodmlref, pos);
					}

				},
				themes : {
					theme: "classic",
					dots : true,
					icons: true
				},
				types : {
					"valid_children": ["root"],
					"max_children" : 1,
					"types" : {
						"root" : {
							 "icon" : {  
								 "image" : icons.ModelsIcon 
							 }, 
							"valid_children" : [ "model" ],
							"max_children" : -1
						},
						"model" : {
							"icon":{"image":icons.vodmlModelIcon},
							"valid_children" : [ "package", "objectType", "dataType", "primitiveType", "enumeration" ],
							"max_children" : -1
						},
						"package" : {
							"valid_children" : [ "package", "objectType", "dataType", "primitiveType", "enumeration" ],
							"max_children" : -1
						},
						"primitiveType" : {
							 "icon" : {  
								 "image" : icons.primitiveTypeIcon 
							 }, 
							"max_children" : 0
						},
						"enumeration" : {
							 "icon" : {  
								 "image" : icons.enumerationIcon 
							 }, 
							"max_children" : 0
						},
						"dataType" : {
							 "icon" : {  
								 "image" : icons.dataTypeIcon
							 }, 
							"max_children" : 0
						},
						"objectType" : {
							 "icon" : {  
								 "image" : icons.objectTypeIcon 
							 }, 
							"max_children" : 0
						}
					}
				}
			}).bind("loaded.jstree", function(e,data) {
				treeIsInitialized = true; // must be set first, otherwise addMOdels will fail
				if(models != null) that.addModels(models);
			});
		}; // init()
		that.init();
	};
	var ModelsTreeViewListener = function(list) {
		if(!list) list = {};
		return jQuery.extend({
			typeSelected : function(vodmlref) {},
			addNewModel : function() {},
			loadIVOAModel : function(modelName) {},
			clearModels:function(){}
		}, list);
	};
	//===============================================
	var ModelsManager = function(){
		var that = this;
		this.vodml = new VODML();
		
		this.clearAll=function(){
			that.vodml.clearAll();
		};
		/**
		 * who is listening to us?
		 */
		var listeners = new Array();
		/**
		 * add a listener to this model
		 */
		this.addListener = function(list){
			listeners.push(list);
		};
		/////////////////////////
		this.notifyLoadModelStarted = function(name,url) {
			jQuery.each(listeners, function(i){
				listeners[i].loadModelStarted(name,url);
			});
		};
		this.notifyLoadModelEnded = function(newModels, name) {
			jQuery.each(listeners, function(i){
				listeners[i].loadModelEnded(newModels, name);
			});
		};
		this.notifyLoadModelError = function(error) {
			jQuery.each(listeners, function(i){
				listeners[i].loadModelError(error);
			});
		};
		/////////////////////////
		// done sync mode so that default models will be loaded before others can be added
		this.loadModel = function(name, url, async) {
			async = typeof async !== 'undefined'?async:false;
			that.notifyLoadModelStarted(name, url);
			if(that.vodml.models_url[url] != null) {
				that.notifyLoadModelEnded([], null);
				return;
			}
//			_url=LoaderURL+encodeURIComponent (url)+"&name="+name+"&vodmlurl="+encodeURIComponent(IVOA_Models["vo-dml"]);
			_url=LoaderURLRoot
			data={"action":"loadVO-DML","url":url,"vodmlurl":IVOA_Models["vo-dml"]['xml']}
			if(name != null){
				data["name"]=name;
			}			
			jQuery.ajax({
				url:_url,
				async:async,
				dataType:"text",
				data:data,
				success: function(vodmlModels) {
					if(vodmlModels == null ) {
						that.notifyLoadModelError("No VO-DML model found for model name "+name+" at url "+url+", can not initialise model.");
						return;
					}
					var newModels = that.vodml.addModels(vodmlModels);
					that.notifyLoadModelEnded(newModels, name);
				},
				error: function(error){
					that.notifyLoadModelError(
							"an error occurred while querying for model at "+url+": "
							+ error.status+" "+error.statusText);
				}
			});
			
		};
		this.model4vodmlref = function(vodmlref)
		{
			return that.vodml.model4vodmlref(vodmlref);
		};
		this.findType = function(vodmlref){
			return that.vodml.findType(vodmlref);
		};
		this.find = function(vodmlref)
		{
			return that.vodml.findVODMLElement(vodmlref);
		};
		this.vodmlref = function(vodmlDecl)
		{
			var model = jQuery(vodmlDecl).closest('model');
			var vodmlid = jQuery(vodmlDecl).find(">vodml-id").text();
			return jQuery(model).find(">name").text()+":"+vodmlid;
		}
		// return true if the type represented by the vodmlref is contained,
		// either directly or because a super type is contained
		this.findContainer = function(vodmlref)
		{
			return that.vodml.findContainer(vodmlref);
		};
		this.checkRoleTypeCompatible = function(role, targetType)
		{
			return that.vodml.checkRoleTypeCompatible(role, targetType);
		};
	};

	/**
	 * let people create listeners easily
	 */
	var ModelsListener = function(list) {
		if(!list) list = {};
		return jQuery.extend({
			loadModelStarted : function(name,url) {},
			loadModelError : function(message) {},
			loadModelEnded : function(model,name) {}

		}, list);
	};
//============================================================
	// StateLoader is trying to perform most actions in sync mode, making it easier 
	// to serialise the appropriate calls. Only the tree completion action cannot be serialised,
	// hence for those we need to wait. These will be done at the end.
	// Important to turn of the listenin gof the base controller to the event notifications
	var StateLoader = function(models, modelsTreeView, tablesManager, mapperController) {
		var that = this;
		var isLoading = false;
		var startTime, endTime;
		var currentState = null;
		var modelCount = 0;
		var tapSchemaCount = 0;
		var vizierTablesCount = 0;
		var uploadTablesCount = 0;

		function reset(keepState){
			isLoading = false;
			currentState = typeof keepState !== 'undefined'?keepState:null;
			modelCount = 0;
			jQuery("#splashscreen").dialog("close");

		};
		this.getCurrentState = function(){
			return currentState;
		};
		this.setCurrentState = function(state){
			currentState=state;
		}
		this.loadState = function(state){
			if(isLoading){
				logConsole.log("Call made to loadState while loading process in progress","STATELOADER");
				alert("Cannot load a state while a loading process is in progress, try again later");
				return;
			}
			isLoading = true;
			startTime = (new Date()).valueOf();
			endTime = -1;
			tapTablesCount = 0;
			vizierTablesCount = 0;
			uploadTablesCount = 0;

			currentState = state;
			modelCount = 0;
			
			try {
				jQuery("#splashscreen").dialog("open");

				var t0 = (new Date()).valueOf();
				mapperController.clearAll();
				mapperController.mapperView.initState(state.stateId, state.counter);
				models.clearAll();
//				loadModels(state);
				modelsTreeView.init(models.vodml.getModels());
				tablesManager.clearAll(); // will init treeview, triggering a treeloaded event
				// TODO trigger loading of rest of mapping state in different, more direct way
			} catch(error){
				// TODO improve error message, do an alert as well.
				logConsole.log("Error loading state: "+error.message, "STATELOADER");
				reset();
			}
		};

		this.clearAll = function() {
			var t0 = getTime();
			reset();
			doClearAll();
			endTiming(t0,"clearAll", "STATELOADER");
		};
		function doClearAll() {
			var t0 = getTime();
			models.clearAll();
			endTiming(t0,"models.clearAll()", "STATELOADER");
			t0 = getTime();
			mapperController.clearAll();
			endTiming(t0,"mapperController.clearAll()", "STATELOADER");
			t0 = getTime();
			tablesManager.clearAll();
			endTiming(t0,"tablesManager.clearAll()", "STATELOADER");
			t0 = getTime();
			modelsTreeView.clearAll();  
			endTiming(t0,"modelsTreeView.clearAll()", "STATELOADER");
		};
		// start model loading process by doing first.
		function loadModels(state){
			var t0 = getTime();
			jQuery(state.models).each(function(i){
				models.loadModel(this.name,this.url,false); //false->sync IMPORTANT!
			});
			endTiming(t0,"loadModels", "STATELOADER::loadModels");
		};
		function loadTables(state){
			var t0 = getTime();

			loadVizieRTables(state);
			loadVOTables(state);
			loadTAPSchemas(state);
//			drawTables(state); // is sync
			endTiming(t0,"loadTables",  "STATELOADER::loadTables");

		}
		function loadVOTables(state){
			jQuery(state.tables.VOTABLEs).each(function(i){
				tablesManager.votablesManager.loadVOTable(state.tables.VOTABLEs[i], false); //false->sync IMPORTANT!
			});
		} ;
		function loadVizieRTables(state){
			jQuery(state.tables.VizieR).each(function(i){
				tablesManager.votablesManager.loadVizieR(state.tables.VizieR[i], false); //false->sync IMPORTANT!
			});
		} ;
		function loadTAPSchemas(state){
			jQuery(state.tables.TAP).each(function(i){
				tablesManager.tapManager.tapModel.getTAP_schemas(this.endpoint, false); // false->sync IMPORTANT!
				var ep = tablesManager.tapManager.tapModel.tap_schemas[this.endpoint];
				jQuery.each(this.schemas, function(){
					var schema = ep.schemas[this];
					tablesManager.tapManager.getTAP_Tables(schema.id, false); // false->sync IMPORTANT!
				});
			});
		} ;
		
		/*
		 * first draw tables.
		 * The recursively, starting from objects with no incoming connections:
		 *  - draw object
		 *  - draw connections from object to table(s)
		 *  - draw incoming connections from object to 
		 */
		function drawMapRecursively(state){
			var objects={};
			jQuery.each(state.mapper.objects, function(){
				objects[this.id]={"node":this,"tables":[],"incoming":[],"outgoing":[],"isDrawn":false,"isConnected":false};
			});
			jQuery.each(state.mapper.maps, function(){
				var _from = this.from;
				var o = objects[_from.objectId];
				var _to = this.to;
				if ("tableId" in _to){
					o.tables.push(this);
				} else if("objectId" in _to){
					o_to=objects[_to["objectId"]]
					o.outgoing.push(o_to);
					o_to.incoming.push({"connection":this,"source":o});
				}
			});
			var roots = [];
			jQuery.each(objects, function(){
				if (this.incoming.length == 0){
					roots.push(this);
				}
			});
			// this does not produce nicest drawing but happens if there are cycles.
			if(roots.length == 0){
				root = objects;
			}
			var t0 = getTime();
			jsPlumb.setSuspendDrawing(true);
			
			drawTables(state);
			
			var delayed=[]
			drawTypesRecursively(roots,delayed);
			jQuery.each(delayed,function(){
				mapperController.drawConnection(this.connection);
			});
			collapseThem(state);

			
			jsPlumb.setSuspendDrawing(false,true);
			endTiming(t0,"drawTypes", "STATELOADER::drawTypes");
		}
		
		/*
		 * If somehow, say due to cycle in graph, a connection cannot yet be drawn,
		 * say because one of two endpoints is not yet drawn, add ot top the dalayed array.
		 */
		function drawTypesRecursively(roots, delayed){
			var next = [];
			jQuery.each(roots, function(){
				if(!this.isDrawn){
					drawTypeWithConnections(this,delayed)
					next=next.concat(this.outgoing)
				}
			});
			if(next.length > 0){
				drawTypesRecursively(next,delayed);
			}
		};		
		function drawTypeWithConnections(o,delayed){
			var node = o.node;
			var pos = {x:node.position.left,y:node.position.top};
			mapperController.showType(node.vodmlref, mapperController.globalPosition(pos), node);
			o.isDrawn=true;
			jQuery.each(o.tables, function(){
				mapperController.drawConnection(this);
			});
			jQuery.each(o.incoming, function(){
				if(!this.source.isDrawn){
					delayed.push(this);
					logConsole.log("source "+this.source.node.id+"["+this.source.node.vodmlref+"] for incoming connection to "+
					node.id+"["+node.vodmlref+"] not yet drawn","MAPPER")
				} else{
					mapperController.drawConnection(this.connection);
				}
			});
		};

		function drawTypes(state){
			var t0 = getTime();
			jsPlumb.setSuspendDrawing(true);
			jQuery.each(state.mapper.objects, function(){
				var pos = {x:this.position.left,y:this.position.top};
				mapperController.showType(this.vodmlref, mapperController.globalPosition(pos), this);
			});
			jsPlumb.setSuspendDrawing(false,true);
			endTiming(t0,"drawTypes", "STATELOADER::drawTypes");
		};
		function drawTables(state){
			var t0 = getTime();
			jsPlumb.setSuspendDrawing(true);
			jQuery.each(state.mapper.tables, function(){
				// TODO find table description
				var pos = {x:this.position.left,y:this.position.top};
				var table = tablesManager.findTable(this.source.id);
				mapperController.showTable(table, mapperController.globalPosition(pos),this.id); // showTable2 uses local position
			});
			jsPlumb.setSuspendDrawing(false,true);
			endTiming(t0,"drawTypes", "STATELOADER::drawTables");
		};
		function getTime(){
			return (new Date()).valueOf();
		}

		function endTiming(st, call, context){
			var et = getTime();
			logConsole.log("call took "+(et-st)+" msec", context);
		}
		function drawConnections(state){
			var t0 = getTime();
			jsPlumb.setSuspendDrawing(true);
			jQuery.each(state.mapper.maps, function(){
				mapperController.drawConnection(this);
			});
			jsPlumb.setSuspendDrawing(false,true);
			endTiming(t0,"drawConnections", "STATELOADER::drawConnections");
		}
		function collapseThem(state){
			var t0 = getTime();
			jsPlumb.setSuspendDrawing(true);
			jQuery.each(state.mapper.objects, function(){
				if(this.collapsed == true){
					var node = jQuery("#"+this.id);
					mapperController.mapperView.collapse(this.id, node);
				}
			});
			jsPlumb.setSuspendDrawing(false,true);
			endTiming(t0,"collapseThem", "STATELOADER::collapseThem");

		}

		// ~~~ listeners ~~~
		var tablesTreeListener = new TablesTreeViewListener({
			tablesTreeLoaded : function(){
				if(!isLoading) return;
				try {
					logConsole.log("Starting loading tables","STATELOADER::tablesTreeLoaded");
					loadTables(currentState); // all serial ???
					loadModels(currentState);
					
					drawMapRecursively(currentState)
//					drawTypes(currentState);
//					drawConnections(currentState);
//					collapseThem(currentState);
					reset(currentState); // only if all serial ...

				} catch(err){
					if(err == null) err = "NOERROR";
					logConsole.log("Error loading mapping: '"+err+"'","STATELOADER::tablesTreeLoaded");
					alert("Error occurred, check log console");
					reset();
				} finally {
					endTime = getTime();
					jsPlumb.setSuspendDrawing(false,true);
					logConsole.log("Total time for loading states = "+(endTime-startTime),"STATELOADER");
				}
			}
		});
		tablesManager.tablesTreeView.addListener(tablesTreeListener);

	};
//============================================================

	
	return {
		BaseController:BaseController
	};
	
})();

