// endpoints and action names

var TAP = namespace("vodml.mapper.tap");
// TODO create model types
/**
 * @memberOf TAP.TAP_SCHEMA
 */
TAP.TAP_SCHEMA = function(_endpoint)
{
	var that = this;
	this.endpoint = _endpoint;
	this.schemas = null;
	this.addSchema = function(schema)
	{
		if(that.schemas == null) that.schemas = new Object();
		that.schemas[schema.name] = schema;
	};
	this.getSchema = function(name)
	{
		if(schemas == null) return null;
		return schemas[name];
	};

};
/**
 * @memberOf TAP.Schema
 */
TAP.Schema = function(_tap_schema, _name)
{
	var that = this;
	this.tap_schema = _tap_schema;
	this.name = _name;
	this.tap_schema.addSchema(this);
	this.id = this.tap_schema.endpoint + "#" + this.name;

	this.tables = null;
	this.addTable = function(table)
	{
		if(that.tables == null) that.tables = new Object();
		that.tables[table.name] = table;
		table.schema = that;
	};
	this.getTable = function(name)
	{
		if(that.tables == null) return null;
		return that.tables[name];
	};
	this.getEndpoint = function()
	{
		return that.tap_schema.endpoint;
	};
};
// end model types
/**
 * @memberOf TAP.Controller
 */
TAP.Controller = function(tablesController) {
	var that = this;
	this.tapModel = new TAP.Model();
	var tapView = new TAP.View("tapschemas", that.tapModel,"tapschematables");
	
	
	this.clearAll = function(){
		tapView.clearAll();
		that.tapModel.clearAll();
	};
	this.getTAP_schemas = function()
	{
		return that.tapModel.tap_schemas;
	};
	this.getTAP_columns = function(table, callbackFnc)
	{
		that.tapModel.getTAP_columns(table, callbackFnc);
	};
	jQuery("#loadTAPEndpointButton").click(function(){loadTAPEndpoint();});
	function loadTAPEndpoint()
	{
		var elt = document.getElementById("tapendpoint");
		var ep= elt.options[elt.selectedIndex].text;
		that.tapModel.getTAP_schemas(ep);
	};

	this.getTAP_Tables = function(schemaId, async)
	{
		async = typeof async !== 'undefined'?async:true;
		that.tapModel.getTAP_tables(schemaId, async);
	};
	
	var tmListener = new TAP.ModelListener({
		getTAP_schemas_Started : function(endpoint) {
			logConsole.log("Starting loading TAP_SCHEMA.schemas from " + endpoint, "TAP.Controller");
		},
		getTAP_schemas_Error : function(endpoint, message) {
			logConsole.log("Error loading TAP_SCHEMA.schemas from '"+endpoint+"' : " + message, "TAP.Controller");
		},
		getTAP_schemas_Ended : function(tap_schema) {
			tapView.refreshSchemas(tap_schema);
			logConsole.log("Done loading TAP_SCHEMA.schemas from '"+tap_schema.endpoint+"'", "TAP.Controller");
		},
		getTAP_tables_Started : function(schema) {
			logConsole.log("Starting loading TAP_SCHEMA.tables for schema '"+schema.name+"' from " + schema.getEndpoint(), "TAP.Controller");
		},
		getTAP_tables_Error : function(schema, message) {
			logConsole.log("Error loading TAP_SCHEMA.tables for schema '"+schema.name+"'from '"+schema.getEndpoint()+"' : " + message, "TAP.Controller");
		},
		getTAP_tables_Ended : function(schema) {
			tablesController.addTAP_schema(schema);
			logConsole.log("Done loading TAP_SCHEMA.tables for schema '"+schema.name+"'from '"+schema.getEndpoint()+"'", "TAP.Controller");
		}
	});
	that.tapModel.addListener(tmListener);
	
	var tvListener = new TAP.ViewListener({
		loadTAP_tables : function(schemaId) {
			that.getTAP_Tables(schemaId);
		}
	});
	tapView.addListener(tvListener);
};
// ===============================================
// Manages TAP data 
// ===============================================
/**
 * @memberOf TAP.Model
 */
TAP.Model = function(tapManager) {
	var that = this;
		
	var loaderEndpoint = "modelLoader?action=";
	var TAP_schemas_URL = loaderEndpoint+"TAP_schemas&";
	var TAP_tables_URL = loaderEndpoint+"TAP_tables&";
	var TAP_columns_URL = loaderEndpoint+"TAP_columns&";

	// holding data
	this.tap_schemas = new Object();
	this.schemas = new Object();

	this.clearAll = function(){
		this.tap_schemas = new Object();
		this.schemas = new Object();
	};
	
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
	this.notify_getTAP_schemas_Started = function(endpoint) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_schemas_Started(endpoint);
		});
	};
	this.notify_getTAP_schemas_Ended = function(schema) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_schemas_Ended(schema);
		});
	};
	this.notify_getTAP_schemas_Error = function(endpoint, message) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_schemas_Error(endpoint, message);
		});
	};
	this.notify_getTAP_tables_Started = function(schema) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_tables_Started(schema);
		});
	};
	this.notify_getTAP_tables_Ended = function(schema) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_tables_Ended(schema);
		});
	};
	this.notify_getTAP_tables_Error = function(schema, error) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_tables_Error(schema, error);
		});
	};
	this.notify_getTAP_columns_Started = function(table) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_columns_Started(table);
		});
	};
	this.notify_getTAP_columns_Ended = function(table) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_columns_Ended(table);
		});
	};
	this.notify_getTAP_columns_Error = function(table, message) {
		jQuery.each(listeners, function(i) {
			listeners[i].getTAP_columns_Error(table, message);
		});
	};
	// ///////////////////////
	this.getTAP_tables = function(schemaId, async) {
		async = typeof async !== 'undefined'?async:true;
		
		var schema = that.findSchema(schemaId);
		that.notify_getTAP_tables_Started(schema);
		if (schema.tables != null)
		{
			that.notify_getTAP_tables_Ended(schema);
			return;
		}
		var endpoint = schema.getEndpoint();
		var queryString = "tap_endpoint=" + encodeURIComponent(endpoint)+"&schema_name="+schema.name;
		url = TAP_tables_URL + queryString;
		jQuery.ajax({
			url : url,
			async : async,
			dataType : "text",
			success : function(xml) {
				if (xml == null) {
					that.notify_getTAP_tables_Error("No TAP_SCHEMA tables found at endpoint " + endpoint);
					return;
				}
				addTAP_tables(schema, xml);
				that.notify_getTAP_tables_Ended(schema);
			},
			error : function(error) {
				that.notify_getTAP_tables_Error("an error occurred while querying for TAP_SCHEMA.tables at " + endpoint + ": " + error.status + " " + error.statusText);
			}
		});
	};
	// retrieve schemas, without tables! for a tap endpoint
	this.getTAP_schemas = function(endpoint, async) {
		async = typeof async !== 'undefined'?async:true;
		that.notify_getTAP_schemas_Started(endpoint);
		if (that.tap_schemas[endpoint] != null)
		{
			that.notify_getTAP_schemas_Ended(that.tap_schemas[endpoint],endpoint);
			return;
		}
		var queryString = "tap_endpoint=" + encodeURIComponent(endpoint);
		url = TAP_schemas_URL + queryString;
		jQuery.ajax({
			url : url,
			async : async,
			dataType : "text",
			success : function(xml) {
				if (xml == null) {
					that.notify_getTAP_schemas_Error("No TAP_SCHEMA model found at endpoint " + endpoint);
					return;
				}
				var tap_schema = addTAP_schemas(xml);
				that.notify_getTAP_schemas_Ended(tap_schema);
			},
			error : function(error) {
				that.notify_getTAP_schemas_Error("an error occurred while querying for TAP_SCHEMA.tables at " + endpoint + ": " + error.status + " " + error.statusText);
			}
		});
	};
	function addTAP_schemas(xml) {
		var jdom = jQuery(jQuery.parseXML(xml));
		var tap = jdom.find(">ns2\\:TAP_SCHEMA");
		tap = jdom.find("*").eq(0); // do this to avoid Chrome problems with
										// namespace
		var endpoint = jQuery(tap).find(">endpoint").text();
		var tap_schema = new TAP.TAP_SCHEMA(endpoint);
		that.tap_schemas[endpoint] = tap_schema;
		jQuery(tap).find(">schema").each(function() {
			addSchema(tap_schema, this);
		});
		return tap_schema;
	};
	/**
	 * @function
	 * @memberOf TAP.Model
	 */
	var addSchema = function(tap_schema, xml) {
		var name = jQuery(xml).find(">schema_name").text();
		var schema = new TAP.Schema(tap_schema, name);
		schema.description = jQuery(xml).find(">description").text();
//		schema.numTables = jQuery(xml).find(">numTables").text();
		jQuery(xml).find(">table").each(function() {
			addTable(schema, this);
		});
		that.schemas[schema.id] = schema;
	};
	this.findSchema = function(schemaId)
	{
		return that.schemas[schemaId];
	};
	/**
	 * @function
	 * @memberOf TAP.Model
	 */
	var addTAP_tables = function(schema, xml) {
		var jdom = jQuery(jQuery.parseXML(xml));
		var tap = jdom.find(">ns2\\:TAP_SCHEMA");
		tap = jdom.find("*").eq(0); // do this to avoid Chrome problems with
										// namespace
		var endpoint = jQuery(tap).find(">endpoint").text();
		var tap_schema = that.tap_schemas[endpoint];
		if(tap_schema == null) return; // TODO throw alert
		jQuery(tap).find(">schema").each(function() {
			var name = jQuery(this).find(">schema_name").text();
			if(name != schema.name) return; // TODO unexpected, throw alert?
			jQuery(this).find(">table").each(function() {
				addTable(schema, this);
			});
		});
	};
	/**
	 * @function
	 * @memberOf TAP.Model
	 */
		function addTable(schema, xml) {
			var table = new SourceTable();
			var name = jQuery(xml).find(">table_name").text();
			var tablename = (schema.name == "" ? name : name.replace(schema.name, "")); // keep
																						// '.'
			table.name = name; // TODO, could use short version
			table.id = schema.id + tablename; // '.' was kept
			table.type = "TAP_TABLE";
			table.description = jQuery(xml).find(">description").text();
			// TAP info
			var info = new Object();
			info.schema_name = schema.name;
			info.endpoint = schema.getEndpoint();
			table.info = info;

			schema.addTable(table);
		}
		/**
		 * @function
		 * @memberOf TAP.Model
		 */
		function addColumns(table, xml) {
			// TODO check columns is null
			var xmlDoc = jQuery(jQuery.parseXML(xml));
			var tap = xmlDoc.find(">ns2\\:TAP_TABLE");
			tap = xmlDoc.find("*").eq(0); // do this to avoid Chrome problems with
											// namespace
			var rank = 0;
			jQuery(tap).find(">column").each(function() {
				var col = jQuery(this);
				var column = new SourceColumn(table.id, rank);
				rank = rank + 1;
				column.name = col.find(">column_name").text();
				column.xtype = col.find(">datatype").text();
				column.datatype = datatypeForADQLType(column.xtype);
				column.description = col.find(">description").text();
				column.ucd = col.find(">ucd").text();
				column.utype = col.find(">utype").text();
				column.unit = col.find(">unit").text();
				var size = col.find(">size").text();
				if(size != null && size.length > 0) column.arraysize = size
//				if(column.arraysize != null){
//					logConsole.log("found non-trivial arraysize [" + column.arraysize+ "] for table.column = "+table.name+"."+column.name);
//				}
				column.table = table;
				column.id = table.id + "." + column.name;
				table.addColumn(column);
			});

		}
		
		function datatypeForADQLType(adqltype){
			if(adqltype == null) return null;
			var xtype=adqltype.toLowerCase();
			if(xtype.indexOf("adql:") == 0) xtype=xtype.substring(5,xtype.length) // don't use startsWith, not supported on IE11
			if(xtype == "blob") return "unsignedByte"
			if(xtype == "clob" || xtype=="timestamp" || xtype == "point" || xtype=="region") return "char"
			return xtype;
		}
		
		/**
		 * @function
		 * @memberOf TAP.Model
		 */
		this.getTAP_columns = function(table, callbackFnk, async) {
			async = typeof async !== 'undefined'?async:false;
			if (table.columns != null) {
				callbackFnk.call();
				return;
			}
			var url = table.info.endpoint;
			var queryString = "tap_endpoint=" + encodeURIComponent(url) + "&table_name=" + encodeURIComponent(table.name);
			url = TAP_columns_URL + queryString;
			jQuery.ajax({
				url : url,
				async : async,
				dataType : "text",
				success : function(xml) {
					if (xml == null) {
						that.notify_getTAP_columns_Error("No TAP_SCHEMA columns found at endpoint " + url);
						return;
					}
					// load columns to table
					addColumns(table, xml);
					callbackFnk.call()
				},
				error : function(error) {
					that.notify_getTAP_columns_Error("an error occurred while querying for TAP_SCHEMA.columns at " + url + ": " + error.status + " " + error.statusText);
				}
			});

		};

};
	/**
	 * Defining the listener with all no-op methods implies a listener
	 * implementation need only implment those methods it is interested in!
	 * @memberOf TAP.ModelListener
	 */
TAP.ModelListener = function(list) {
	if (!list)
		list = {};
	return jQuery.extend({
		getTAP_schemas_Started : function(endpoint) {},
		getTAP_schemas_Error : function(endpoint, message) {},
		getTAP_schemas_Ended : function(tap_schema) {},
		getTAP_tables_Started : function(schema) {},
		getTAP_tables_Error : function(schema, message) {},
		getTAP_tables_Ended : function(schema) {},
		getTAP_columns_Started : function(table) {},
		getTAP_columns_Error : function(table, message) {},
		getTAP_columns_Ended : function(table) {}
	}, list);
};
// tap view
/**
 * @memberOf TAP.View
 */
TAP.View = function(selId, model, tablesSelId) {
	var that = this;
		
	
	this.clearAll = function(){
		jQuery("#"+selId+" option").remove();
		jQuery("#"+tablesSelId+" option").remove();
		jQuery("#tapschemaDescription").html("");
		jQuery("#loadTAPTablesButton").attr("disabled","disabled");
	};
	
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
	function notify_loadTAP_Button_clicked(schemaId) {
		jQuery.each(listeners, function(i) {
			listeners[i].loadTAP_tables(schemaId);
		});
	};
// ///////////////////////////////////////////
	jQuery("#"+selId).change(function(){
		var schema=model.findSchema($(this).children(":selected").val());
		if(schema != null) {
			jQuery("#loadTAPTablesButton").removeAttr("disabled");
			jQuery("#tapschemaDescription").html("schema: "+schema.name+"<br/>description: "+schema.description);
//					+"<br/> number of tables: " +schema.numTables);
			
		}
		else {
			that.clearAll();
		}

	});
	jQuery("#loadTAPTablesButton").click(function(){
		notify_loadTAP_Button_clicked(jQuery("#"+selId).children(":selected").val());
	});
	this.refreshSchemas = function(tap_schema)
	{
		that.clearAll();
		var i = 0;
		jQuery.each(tap_schema.schemas, function(){
			i = i+1;
			jQuery("#"+selId).append(jQuery("<option></option>")
					.attr("value",this["id"])
					.text(this["name"]));
		});
	};
	this.refreshSchemaTables = function(tap_tables)
	{
		that.clearAll();
		var i = 0;
		jQuery.each(tap_tables, function(){
			i = i+1;
			jQuery("#"+tablesSelId).append(jQuery("<option></option>")
					.attr("value",this["id"])
					.text(this["name"]));
		});
	};
};
TAP.ViewListener = function(list) {
	if (!list)
		list = {};
	return jQuery.extend({
		loadTAP_tables : function(schemaId) {}
	}, list);
};
