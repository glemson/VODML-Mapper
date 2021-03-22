//===============================================
// definition of a table source
function SourceTable() {
	var that = this;
	this.id = null;
	this.type = null; // VOTABLE TAP_TABLE SCSTABLE FITSTABLE ...
	this.name = null;
	this.original_name = null;
	this.description = null;
	this.info = null;
	this.columns = null;
	this.params = null;
	this.DATA = null;
};
SourceTable.prototype.addColumn = function(column) {
	if (!(column instanceof SourceColumn)) {
		alert("BUG: Can only add SourceColumn to SourceTable");
		return;
	}
	if (this.columns == null) {
		this.columns = new Array();
	}
	this.columns.push(column);
};
SourceTable.prototype.addParam = function(param) {
	if (!(param instanceof SourceColumn)) {
		alert("BUG: Can only add param as SourceColumn to SourceTable");
		return;
	}
	param.type="PARAM";
	if (this.params == null) {
		this.params = new Array();
	}
	
	this.params.push(param);
};
SourceTable.prototype.setDATA = function(DATA) {
// IF a VOTABL::TABLE has DATA element, store it here
	this.DATA = DATA;
};
SourceTable.prototype.getState = function() {
	var state = new Object();
	state.name = this.name;
	state.id = this.id;
	state.type = this.type;
	state.description = this.description;

	if (this.type == "VOTABLE") {
		state.votable_url = this.info["votable-url"];
		state.table_rank = this.info["tableRank"];
		if (this.info["xmlid"])
			state.xmlid = this.info["xmlid"];
		if (this.info["original_name"])
			state.original_name = this.info["original_name"];
	} else if (this.type == "TAP_TABLE") {
		state.tap_endpoint = this.info.endpoint;
		state.schema_name = this.info.schema_name;
	} else if (this.type == "VIZIER_TABLE") {
		state.name = this.info.name;
	}
	return state;

};
function SourceColumn(_tableId, _rank) {
	var that = this;
	this.id = null;
	this.xmlid = null; // original ID
	this.name = null;
	this.datatype = null;
	this.xtype = null;
	this.utype = null;
	this.ucd = null;
	this.unit = null;
	this.arraysize = null;
	this.description = null;
	this.rank = _rank;
	this.tableId = _tableId
	this.type="COLUMN";
	this.value=null;
	this.getState = function() {
		var state = new Object();
		state.name = that.name;
		state.description = that.description;
		state.datatype = that.datatype;
		state.ucd = that.ucd;
		state.unit = that.unit;
		state.arraysize = that.arraysize;
		state.xtype = that.xtype;
		state.utype = that.utype;
		state.xmlid = that.xmlid;
		state.type = that.type;
		if(that.type == "PARAM"){
			state.value=that.value;
		}
		return state;
	}
};

// Overall controller for table management
var TablesManager = function(config) // a controller
{
	var that = this;
	this.tapManager = new TAP.Controller(this);
	this.votablesManager = new VOTablesManager(this);
	this.tablesTreeView = new TablesTreeView(config.tablesTreeDiv, this);

	this.tables = new Object();
	this.findTable = function(id) {
		return that.tables[id];
	};
	
	this.clearAll = function() {
		that.tablesTreeView.clearAll();
		that.tapManager.clearAll();
		that.votablesManager.clearAll();
		that.tables = new Object();
	};
	
	this.addTable = function(table) {
		// TODO check table does not yet exist
		if (table instanceof SourceTable)
			that.tables[table.id] = table;
		else
			alert("Can only add SourceTable to tables collection");
	};

	this.addTAP_schema = function(schema)
	{
		that.tablesTreeView.addTAP_schema(schema);
		if(schema.tables == null) return;
		jQuery.each(schema.tables, function(){
			that.addTable(this);
		});
	};
	this.loadVOTable = function(url) {
		that.votablesManager.loadVOTable(url);
	};
	this.loadVizieR = function(names) {
		var arrnames = names.split(",");
		jQuery.each(arrnames, function() {
			that.votablesManager.loadVizieR("" + this);
		});
	};
	this.loadTable = function(table, callbackFnc) {
		if (table.type == "TAP_TABLE")
			that.tapManager.getTAP_columns(table, callbackFnc);
		else
			callbackFnc.call();
	};
	var votlist = new VOTablesManagerListener({
		loadVOTableStarted : function(url) {
			logConsole.log("Starting loading VOTable from " + url, "TABLESMANAGER");
		},
		loadVOTableError : function(message) {
			alert("Error loading VOTable : " + message);
			logConsole.log("Error loading VOTable : " + message, "TABLESMANAGER");
		},
		loadVOTableEnded : function(votable, url) {
			that.tablesTreeView.addVOTableNode(votable, url);
			logConsole.log("Done loading VOTable from " + url, "TABLESMANAGER");
		},
		loadVizieREnded : function(votable, name) {
			that.tablesTreeView.addVizieRNode(votable, name);
			logConsole.log("Done loading VizieR Table " + name, "TABLESMANAGER");
		}
	});
	that.votablesManager.addListener(votlist);

};
// ============================================================

var TablesTreeView = function(tablestreediv, tablesManager) {
	var that = this;
	tablestreediv = "#" + tablestreediv;
	this.tablesTree = jQuery(tablestreediv);
	jQuery.jstree._themes = "themes/";
	// --
	this.rootNode = null;
	this.tapRootNode = null;
	var tap_endpoints = new Object();
	this.votablesRootNode = null;
	this.fitsRootNode = null;
	this.scsRootNode = null;

	/**
	 * Clear all content, reinitialise.
	 */
	this.clearAll = function() {
		tap_endpoints = new Object();
		init();
	};

	/**
	 * @function
	 * @memberOf TAP.TablesTreeVIew
	 */
	this.getState = function()
	{
		var ts = new Object();
		ts["TAP"] = new Array();
		jQuery.each(tap_endpoints, function(key,value)
		{
			var te = new Object();
			te.endpoint = key;
			te.schemas = new Array();
			jQuery.each(value.schemas, function() {
				te.schemas.push(this.name);
			});
			ts.TAP.push(te);
		});
		ts["VizieR"] = new Array();
		jQuery.each(tablesManager.votablesManager.viziertables, function(key,value)
		{
			ts.VizieR.push(key);
		});
		ts["VOTABLEs"] = new Array();
		jQuery.each(tablesManager.votablesManager.votables, function(key,value)
		{
			ts.VOTABLEs.push(key);
		});
		return ts;
	};
	

	
	/**
	 * who is listening to us?s
	 */
	var listeners = new Array();
	/**
	 * add a listener to this model
	 */
	this.addListener = function(list) {
		listeners.push(list);
	};
	// ///////////////////////
	this.notifyTablesTreeLoaded = function() {
		jQuery.each(listeners, function(i) {
			listeners[i].tablesTreeLoaded();
		});
	};
	this.notifyTableDropped = function(table, position) {
		jQuery.each(listeners, function(i) {
			listeners[i].tableDropped(table, position);
		});
	};
	this.notifyRemoveVIZIER_TABLE = function(tableId) {
		jQuery.each(listeners, function(i) {
			listeners[i].removeVizieRTable(tableId);
		});
	};
	// =================================
	// add new set of tables for a , specified by xml
	// =================================
	/**
	 * @function
	 * @memberOf TablesManager
	 */
	this.addTAP_schema = function(schema)
	{
		var tap_endpoint_data = tap_endpoints[schema.getEndpoint()];
		if(tap_endpoint_data == null) {
			tap_endpoint_data = addTAP_endpoint(schema.getEndpoint());
		}
		if(tap_endpoint_data.schemas[schema.name] == null){
			addSchemaNode(schema, tap_endpoint_data);
		}
	};
	
	function addTAP_endpoint(endpoint) {
		var data = {
			"data" : {
				"title" : endpoint,
				"icon" : icons.tapschemaIcon
			},
			"attr" : {
				"id" : endpoint
			}
		};
		var tapnode = that.tablesTree.jstree("create_node", that.tapRootNode, "inside", data);
		var data = new Object();
		data.endpoint = endpoint;
		data.schemas = new Object();
		data.node = tapnode;
		tap_endpoints[endpoint] = data;
		return data;
	};

	function addSchemaNode(schema, parent) {
		var node = parent.node;
		var data = {
			"data" : schema.name,
			"attr" : {
				"id" : schema.id,
				"rel" : "tapschema"
			}
		};
		var schemanode = that.tablesTree.jstree("create_node", node, "inside", data);
		parent.schemas[schema.name] = schema;
		if(schema.tables == null) return;
		jQuery.each(schema.tables, function(key, value) {
			addTAPTableNode(value, schemanode);
		});

	}
	;
	function addTAPTableNode(table, parent) {
		var data = {
			"data" : {
				"title" : table.name,
				"icon" : icons.tableIcon
			},
			"attr" : {
				"id" : table.id,
				"rel" : "taptable",
				"tableId" : table.id
			}
		};
		var tablenode = that.tablesTree.jstree("create_node", parent, "inside", data);

	};

	this.addVOTableNode = function(votable, url) {
		var data = {
			"data" : votable.name +" ["+votable.url+"]",
			"attr" : {
				"id" : url,
				"votable" : votable,
				"rel" : "VOTABLE"
			}
		};
		var votnode = that.tablesTree.jstree("create_node", that.votablesRootNode, "inside", data);
		jQuery.each(votable.resources, function() {
			addVOTableResource(this, votnode);
		});
	};
	function addVOTableResource(resource, parent) {
		var data = {
			"data" : "resource",
			"attr" : {
				"rel" : "RESOURCE"
			}
		};
		var resourcenode = that.tablesTree.jstree("create_node", parent, "inside", data);
		jQuery.each(resource.resources, function() {
			addVOTableResource(this, resourcenode);
		});
		jQuery.each(resource.tables, function() {
			addVOTableTable(this, resourcenode);
		});

	}
	;
	function addVOTableTable(table, parent) {
		var data = {
			"data" : {
				"title" : table.name,
				"icon" : icons.tableIcon
			},
			"attr" : {
				"id" : table.id,
				"rel" : "TABLE",
				"tableId" : table.id
			}
		};
		var tablenode = that.tablesTree.jstree("create_node", parent, "inside", data);

	}
	;
	this.addVizieRNode = function(table, name) {
		var data = {
			"data" : {
				"title" : name,
				"icon" : icons.tableIcon
			},
			"attr" : {
				"id" : table.id,
				"rel" : "VIZIER_TABLE",
				"tableId" : table.id
			}
		};
		var votnode = that.tablesTree.jstree("create_node", that.vizierRootNode, "inside", data);
	};

	// ==========================================================
	//==========================================================
	this.openDialog = function(id){
		jQuery("#"+id).dialog("open");
	};
	function getTablesTreeContextMenu(jtnode) {
		var nodetype = jtnode.attr('rel');
		var menu = {
			create : false,
			rename : false,
			remove : false,
			ccp : false
		};
		// remove for: VIZIER_TABLE VOTABLE tapendpoint
		if (nodetype == 'VIZIER_TABLE') {
			menu.removeVIZIER_TABLE = {
				"label" : 'Remove VizieR table',
				"action" : function() {
					that.notifyRemoveVIZIER_TABLE(jtnode.attr('id'));
				},
				"_disabled" : true
			};
		} else if (nodetype == "tapschema") {
			menu.removeTAPSCHEMA = {
				"label" : 'Remove TAP_SCHEMA',
				"action" : function() {
					that.notifyRemoveTAPSCHEMA(jtnode.attr('id'));
				},
				"_disabled" : true
			};
		} else if (nodetype == 'taptable') {
			var id = jtnode.attr('id');
			menu.addTable2Map = {
				"label" : 'Show Info',
				"action" : function() {
					var table = tablesManager.tables[id];
					var doc = table.description;
					alert(doc); //"TODO Provide info about "+id);
				},
				"_disabled" : false
			};
		} else if (nodetype == 'vizierroot') {
			menu.addVizieRTables = {
				"label" : 'Add VizieR table(s)',
				"action" : function() {
					that.openDialog("vizier_dialog");
				},
				"_disabled" : false
			};
		} else if (nodetype == 'taproot') {
			menu.addTAPSchema = {
				"label" : 'Add TAP schema',
				"action" : function() {
					that.openDialog("tapload_dialog");
				},
				"_disabled" : false
			};
		}else if (nodetype == 'votablesroot') {
			/*
			menu.addVOTable = {
				"label" : 'Add Uploaded file',
				"action" : function() {
					that.openDialog("tablefileload_dialog");
				},
				"_disabled" : false
			};*/
			menu.addTableFromURL = {
				"label" : 'Add Table(s) from URL',
				"action" : function() {
					that.openDialog("tableurlload_dialog");
				},
				"_disabled" : false
			};
		}
		;
		return menu;
	}
	;
	this.addTablesRootNodes = function() {
		var rootNode = jQuery("#TABLES__ROOT_NODE");
		if (rootNode == null) {
			var tapData = {
				"data" : "TAP_SCHEMAs",
				"attr" : {
					"id" : "TAP__ROOT_NODE",
					"rel" : "taproot"
				}
			};
			that.tapRootNode = that.tablesTree.jstree("create_node", rootNode, "inside", tapData);
			var votablesData = {
				"data" : "VOTABLEs",
				"attr" : {
					"id" : "VOTABLES__ROOT_NODE",
					"rel" : "votablesroot"
				}
			};
			that.votablesRootNode = that.tablesTree.jstree("create_node", that.rootNode, "inside", votablesData);
		}
	};
	// can pass in a tables object with TAP, VizieR, VOTable components
	var init = function(tables) {
		tables = typeof tables !== 'undefined'?tables:null;
		that.tablesTree.jstree({
			json_data : {
				"data" : [ {
					"attr" : {
						"id" : "TABLES__ROOT_NODE",
						"rel" : "tablesroot"
					},
					"data" : "Tables",
					"state" : "open"
				} ]
			},
			plugins : [ "themes", "ui", "contextmenu", "json_data", "types", "dnd" ],
			contextmenu : {
				select_node : true,
				items : function(node) {
					return getTablesTreeContextMenu(node);
				}
			},
			dnd : {
				"drop_check" : function(data) {
					var rel = data.o.attr("rel");
					return rel == "taptable" || rel == "TABLE" || rel == "VIZIER_TABLE";
				},
				"drop_finish" : function(data) {
					var tableId = data.o.attr("tableId");
					var table = tablesManager.findTable(tableId);
					var pos = {
						"x" : data.e.clientX,
						"y" : data.e.clientY
					};
					that.notifyTableDropped(table, pos);
				}

			},
			themes : {
				theme : "classic",
				dots : true,
				icons : true
			},
			types : {
				"valid_children" : [ "tablesroot" ],
				"max_children" : 1,
				"types" : {
					"tablesroot" : {
						"icon" : {
							"image" : "css/images_jstree/_drive.png"
						},
						"valid_children" : [ "votablesroot", "taproot", "vizierroot" ],
						"max_children" : -1
					},
					"votablesroot" : {
						"valid_children" : [ "VOTABLE" ],
						"max_children" : -1
					},
					"VOTABLE" : {
						"icon" : {
							"image" : icons.votableIcon
						},
						"valid_children" : [ "RESOURCE" ],
						"max_children" : -1
					},
					"vizierroot" : {
						"icon" : {
							"image" : icons.vizierIcon
						},
						"valid_children" : [ "VIZIER_TABLE" ],
						"max_children" : -1
					},
					"VIZIER_TABLE" : {
						"icon" : {
							"image" : icons.tableIcon
						},
						"max_children" : 0
					},
					"taproot" : {
						"icon" : {
							"image" : icons.taprootIcon
						},
						"valid_children" : [ "tapendpoint" ],
						"max_children" : -1
					},
					"tapendpoint" : {
						"icon" : {
							"image" : icons.tapendpointIcon
						},
						"valid_children" : [ "tapschema" ],
						"max_children" : -1
					},
					"tapschema" : {
						"valid_children" : [ "taptable" ],
						"max_children" : -1
					},
					"taptable" : {
						"icon" : {
							"image" : icons.tableIcon
						},
						"max_children" : 0
					},
					"RESOURCE" : {
						"valid_children" : [ "TABLE" ],
						"max_children" : -1
					},
					"TABLE" : {
						"icon" : {
							"image" : icons.tableIcon
						},
						"max_children" : 0
					}
				}
			}
		}).bind("loaded.jstree", function(e, data) {
			var rootNode = jQuery("#TABLES__ROOT_NODE");
// no alphabetic sort on the nodes, add in inverse order to desired sort!
			var votablesData = {
					"data" : {
						title : "VOTABLEs",
						"icon" : icons.ivoaIcon
					},
					"attr" : {
						"id" : "VOTABLES__ROOT_NODE",
						"rel" : "votablesroot"
					}
				};
				that.votablesRootNode = that.tablesTree.jstree("create_node", rootNode, "inside", votablesData);
			var vizierData = {
				"data" : {
					title : "VizieR",
					"icon" : icons.vizierIcon
				},
				"attr" : {
					"id" : "VIZIER__ROOT_NODE",
					"rel" : "vizierroot"
				}
			};
			that.vizierRootNode = that.tablesTree.jstree("create_node", rootNode, "inside", vizierData);
			var tapData = {
					"data" : {
						title : "TAP",
						"icon" : icons.ivoaIcon
					},
					"attr" : {
						"id" : "TAP__ROOT_NODE",
						"rel" : "taproot"
					}
				};
				that.tapRootNode = that.tablesTree.jstree("create_node", rootNode, "inside", tapData);
			that.notifyTablesTreeLoaded();
			
		});

		/*
		 */
	}; // init()
	init();
};
var TablesTreeViewListener = function(list) {
	if (!list)
		list = {};
	return jQuery.extend({
		tableDropped : function(table, position) {},
		tablesTreeLoaded : function(){}
	}, list);
};

var VOTablesManager = function(tablesManager) {
	var that = this;
	var currentId = 1;
	this.votables = new Object();
	this.viziertables = new Object();
	this.tables = new Object();

	
	this.clearAll = function()
	{
		delete this.votables;
		this.votables= new Object();
		delete this.viziertables;
		this.viziertables = new Object();
		delete this.tables;
		this.tables = new Object();
	};
	
	// create new object to represent votable, add name (unique in cnotext)
	function newVOTable(url) {
		var vot = new Object();
		vot.name = "VOTABLE_" + currentId;
		vot.url = url;
		currentId++;
		that.votables[vot.url] = vot;
		return vot;
	}
	;
	function newVizieRTable(name) {
		var vot = new SourceTable();
		vot.name = name;
		that.viziertables[name] = vot;
		return vot;
	}
	;

	/**
	 * who is listening to us?
	 */
	var listeners = new Array();
	/**
	 * add a listener to this model
	 */
	this.addListener = function(list) {
		listeners.push(list);
	};
	// ///////////////////////
	function notifyLoadVOTableStarted(url) {
		jQuery.each(listeners, function(i) {
			listeners[i].loadVOTableStarted(url);
		});
	}
	;
	function notifyLoadVOTableEnded(votable, url) {
		jQuery.each(listeners, function(i) {
			listeners[i].loadVOTableEnded(votable, url);
		});
	}
	;
	function notifyLoadVizieREnded(vizierTable, name) {
		jQuery.each(listeners, function(i) {
			listeners[i].loadVizieREnded(vizierTable, name);
		});
	}
	;
	function notifyLoadVOTableError(error) {
		jQuery.each(listeners, function(i) {
			listeners[i].loadVOTableError(error);
		});
	}
	;
	// ///////////////////////
	this.loadVOTable = function(url, async) {
		async = typeof async !== 'undefined'?async:true;
		if (that.votables[url] != null)
			return;
		var queryString = LoadVOTABLE + "url=" + encodeURIComponent(url);
		notifyLoadVOTableStarted(url);
		jQuery.ajax({
			url : queryString,
			async : async,
			dataType : "text",
			success : function(xml) {
				if (xml == null) {
					that.notifyLoadVOTableError("No VOTable found at " + url);
					return;
				}
				var vot = addVOTable(xml, url);
				notifyLoadVOTableEnded(vot,url);
			},
			error : function(error) {
				notifyLoadVOTableError("an error occurred while loading VOTable at " + url + ": " + error.status + " " + error.statusText);
			}
		});

	};
	this.loadVizieR = function(name, async) {
		async = typeof async !== 'undefined'?async:true;
		if (that.viziertables[name] != null)
			return;
		var url = LoadVizieR + encodeURIComponent(name);
		notifyLoadVOTableStarted(url);
		jQuery.ajax({
			url : url,
			async : async,
			dataType : "text",
			success : function(xml) {
				if (xml == null) {
					that.notifyLoadVOTableError("No VOTable found at " + url);
					return;
				}
				var vot = addVizieRTable(xml, name);
				notifyLoadVizieREnded(vot, name);
			},
			error : function(error) {
				notifyLoadVOTableError("an error occurred while loading VizieR table at " + url + ": " + error.status + " " + error.statusText);
			}
		});

	};
	function addVOTable(xml, url) {
		var jdom = jQuery(jQuery.parseXML(xml));
		var votable = newVOTable(url);
		votable["resources"] = new Array();
		votable["tables"] = new Object();
		votable["numTables"] = 0;
		var VOTABLE = jdom.find(">VOTABLE"); // do this to avoid Chrome
												// problems with namespace
		jQuery.each(VOTABLE.find(">RESOURCE"), function() {
			addResource(this, votable["resources"], votable);
		});
		// TODO extract votable_tables
		return votable;
	}
	;
	function addResource(dom, container, votable) {
		var resource = new Object();
		resource["tables"] = new Array();
		resource["resources"] = new Array();
		container.push(resource);
		var jdom = jQuery(dom);
		jQuery.each(jdom.find(">TABLE"), function() {
			addTable(this, resource.tables, votable);
		});
		jQuery.each(jdom.find(">RESOURCE"), function() {
			addResource(this, resource.resources, votable);
		});
	}
	;
	function addTable(dom, container, votable) {
		var table = new SourceTable();
		container.push(table);
		var jdom = jQuery(dom);
		var n = votable.numTables + 1;

		var info = new Object();

		var name = jdom.attr("name")
		if (name != null) {
			table["name"] = votable.name + "::" + name+"["+n+"]";
			table["original_name"]=name;
			info["original_name"]=name;
		} else {
			table["name"] = votable.name + "::TABLE"+"["+n+"]"
//			table["name"] = votable.name + "::TABLE_" + n;
		}
		var id = votable.url + "#TABLE_"+n;
		table["id"] = id;
		table["type"] = "VOTABLE";
		// VOTABLE info
		table["description"] = jdom.find(">DESCRIPTION").text();
		info["votable-url"] = votable.url;
		info["tableRank"] = n;
		var xmlid = jdom.attr("ID");
		if (xmlid != null) {
			info["xmlid"] = xmlid;
		}
		;
		table.info = info;
		votable.numTables = n;
		votable.tables[id] = table;
		var rank = 0;
		jQuery.each(jdom.find(">FIELD"), function() {
			addColumn(this, table, rank);
			rank = rank + 1;
		});
		rank = 0;
		jQuery.each(jdom.find(">PARAM"), function() {
			addParam(this, table, rank);
			rank = rank + 1;
		});
		jQuery.each(jdom.find(">DATA"), function() {
			table.setDATA(this);
		});
		tablesManager.addTable(table);

	}
	;
	function addColumn(dom, table, rank) {
		var column = new SourceColumn(table.id, rank);
		table.addColumn(column);
		var jdom = jQuery(dom);
		column.name = jdom.attr("name");
		column.datatype = jdom.attr("datatype");
		column.ucd = jdom.attr("ucd");
		column.unit = jdom.attr("unit");
		column.utype = jdom.attr("utype");
		column.description = jdom.find(">DESCRIPTION").text();
		var xmlid = jdom.attr("ID");
		if (xmlid != null) {
			column.xmlid = xmlid;
		}
		;

	}
	;
	function addParam(dom, table, rank) {
		var param =  new SourceColumn(table.id, rank);
		table.addParam(param);
		var jdom = jQuery(dom);
		param.name = jdom.attr("name");
		param.datatype = jdom.attr("datatype");
		param.description = jdom.find(">DESCRIPTION").text();
		param.ucd = jdom.attr("ucd");
		param.utype = jdom.attr("utype");
		param.unit = jdom.attr("unit");
		param.value=jdom.attr("value");
		var xmlid = jdom.attr("ID");
		if (xmlid != null) {
			param["xmlid"] = xmlid;
		}
		;
	}
	;

	function addVizieRTable(xml, name) {
		var jdom = jQuery(jQuery.parseXML(xml));
		var TABLE = jdom.find(">VOTABLE>RESOURCE>TABLE");
		// TODO extract votable_tables
		var table = new newVizieRTable(name);
		table["name"] = "VizieR::" + name;
		var id = table.name;
		table["id"] = id;
		table["type"] = "VIZIER_TABLE";
		table["description"] = TABLE.find(">DESCRIPTION").text();
		// VOTABLE info
		var info = new Object();
		var xmlid = jQuery(TABLE).attr("ID");
		if (xmlid != null) {
			info["xmlid"] = xmlid;
		}
		;
		table.info = info;
		var rank = 0;
		jQuery.each(TABLE.find(">FIELD"), function() {
			addColumn(this, table, rank);
			rank = rank + 1;
		});
		rank = 0;
		jQuery.each(TABLE.find(">PARAM"), function() {
			addParam(this, table, rank);
			rank = rank + 1;
		});
		tablesManager.addTable(table);
		return table;
	}
	;

};
var VOTablesManagerListener = function(list) {
	if (!list)
		list = {};
	return jQuery.extend({
		loadVOTableStarted : function(url) {
		},
		loadVOTableEnded : function(votable, url) {
		},
		loadVOTableError : function(error) {
		}
	}, list);
};