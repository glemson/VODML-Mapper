/*
 * Code supporting a MaperGraph, a graph of nodes consisting of elements
 * in the map connected by edges
 */
/*
 * Node in the MapperGraph
 */
MapperNode = function(value)
{
	var that = this;
	this.id = value.id;
	this.object = value;
	this.inEdges = new Array();
	this.outEdges = new Array();
	this.flag = 0;
	this.tables = new Array();
	this.tablesDict = new Object();
	this.getLabel = function()
	{
		return that.object.vodmlref +"::"+that.id;
	};
	this.addInEdge = function(edge)
	{
		that.inEdges.push(edge);
	};
	this.addOutEdge = function(edge)
	{
		that.outEdges.push(edge);
	};
	this.initVisit = function()
	{
		that.flag = 0;
	};
	this.isVisited = function()
	{
		return that.flag != 0;
	};
	this.isTarget = function()
	{
		return that.inEdges.length > 0;
	};
	function addTable(table)
	{
		that.tablesDict[table.id] = table;
		that.tables.push(table);
	};
	function getTableById(id)
	{
		return that.tablesDict[id];
	};
	this.getTableCount = function()
	{
		return that.tables.length;
	};
	
	this.getTable = function(index)
	{
		return that.tables[index];
	};
	this.visit = function(table)
	{
		if(getTableById(table.id) != null) return;
		addTable(table);
		jQuery.each(that.inEdges, function(){
			if(this.fromType == "primitiveType"
			|| this.fromType == "enumeration"
			|| this.fromType == "dataType"
			|| this.fromType == "instance"
			|| (this.fromType == "reference" && that.object.vodmlref == "vo-dml:Reference")) {
				this.fromNode.visit(table);
			}
		});
	};
};
MapperEdge = function(fromNode, fromType, toNode, toType)
{
	this.fromNode = fromNode;
	this.fromType = fromType;
	this.toINode = toNode;
	this.toType = toType;
};
MapperGraph = function(mapperState, modelsManager) {
	var that = this;
	var nodes = new Object();
	this.objects = new Array();
	this.tables = new Array();
	this.edges = new Array();
	function addObject(value)
	{
		var node = new MapperNode(value);
		nodes[value.id] = node;
		that.objects.push(node);
		return node;
	};
	function addTable(value)
	{
		var node = new MapperNode(value);
		nodes[value.id] = node;
		that.tables.push(node);
	};
   function addEdge(fromId, fromType, toId, toType)
	{
	   var tn = nodes[toId];
	   if(fromType == "reference")
	   {
		   var tovodmlref = tn.object.vodmlref;
		   if(tovodmlref!="vo-dml:Reference") return; // TODO why? because no effect on ordering.
		   else {
			   alert("Found reference to vo-dml:Reference");
		   }
		}
		var fn = nodes[fromId];
		var edge = new MapperEdge(fn, fromType, tn, toType);
		that.edges.push(edge);
		fn.addOutEdge(edge);
		tn.addInEdge(edge);
	};
	this.getNode = function(id)
	{
		return nodes[id];
	};
	this.initVisit = function()
	{
		jQuery.each(nodes, function(){
			this.initVisit();
		});
	};
	function assignTables()
	{
		that.initVisit();
		jQuery.each(that.tables, function(){
			var table = this;
			jQuery.each(this.inEdges, function(){
				this.fromNode.visit(table);
			});
		});
		jQuery.each(that.objects, function(){
			if(this.getTableCount()>1){
				alert("Node "+this.getLabel()+" is assigned to multiple tables");
			}
		});
	};
	jQuery.each(mapperState.mapper.objects,function(key,value){
		addObject(value);
	});
	jQuery.each(mapperState.mapper.tables,function(key,value){
		addTable(value);
	});
	jQuery.each(mapperState.mapper.maps,function(key,value){
		var source = value.from;
		var target = value.to;
		var toId=null;
		if(target.connectorType == "tableColumn" || target.connectorType == "table")
		{
			toId=target.tableId;
		} else {
			toId = target.objectId;
		};
		addEdge(source.objectId, source.connectorType, toId, target.connectorType);
	});
	assignTables(); // identifies which table(s) an object is connected to, either directly or through attribute links
	// check the actual mapping vs the validation rules:
	// ...
};
/* creates a votable from the mapperview state */
VODML2VOTableMapper = function(tablesManager, modelsManager)
{
	var doc = null, mapperState = null, graph = null, voTABLES = null;
	var VOTABLE = null, mappingRESOURCE = null,doneObjects = new Object();
	// XML handling
	function newElement(parent, name)
	{
		var el = doc.createElement(name);
		if(parent != null)parent.appendChild(el);
		return el;
	};
	function addTextChild(parent, name, value)
	{
		var el = newElement(doc, parent, name);
		el.textContent = value;
	};
	this.toVOTable = function(_mapperState)
	{
		// initialize "global" variables
		doc = document.implementation.createDocument(null, "VOTABLE", null);
		voTABLES = new Object();
		graph = new MapperGraph(_mapperState);
		
		mapperState = _mapperState;
		VOTABLE = doc.firstChild;
// ---
		jQuery.each(mapperState.models,function(key,value){
			var group = newGROUP(VOTABLE,null,"vo-dml:Model", null);
			newPARAM(group,"url","char","vo-dml:Model.url",value.url);
			newPARAM(group,"name","char","vo-dml:Model.name",value["name"]);
		});
		// only necessary for unconnected mapping GROUPs
		// check with graph whether such exist.
		mappingRESOURCE = newElement(VOTABLE, "RESOURCE"); 

		// only if a table exists, check with graph

		if (graph.tables.length > 0) {
			var tablesRESOURCE = newElement(VOTABLE, "RESOURCE");

			jQuery.each(graph.tables, function() {
				var table = this.object;
				var TABLE = newTABLE(tablesRESOURCE, table.id);
				voTABLES[table.id] = TABLE;
				var info = table.source;
				newINFO(TABLE, "type", info.type);
				if (info.type == "TAP_TABLE") {
					newINFO(TABLE, "name", info.name);
					newINFO(TABLE, "tap_endpoint", info.tap_endpoint);
					addFIELDs(TABLE, info);
				} else if (info.type == "VOTABLE") {
					newINFO(TABLE, "votable_url", info.votable_url);
					newINFO(TABLE, "table_rank", info.table_rank);
					if (info.xmlid)
						newINFO(TABLE, "ID", info.xmlid);
					addFIELDs(TABLE, info);
				} else if (info.type == "VIZIER_TABLE") {
					newINFO(TABLE, "catalogue_name", info.name);
					if (info.xmlid)
						newINFO(TABLE, "ID", info.xmlid);
					addFIELDs(TABLE, info);
				}
			});
		}
		graph.initVisit();// set done=false;
		
		jQuery.each(graph.objects, function(){
			if(this.isTarget() || this.isVisited()) return ;
			// Ignore filter our standalone primitive values
			var object = this.object;
			if(object.vodmltype == "primitiveType" 
				|| object.vodmltype == "enumeration"
				|| object.vodmlref == "vo-dml:Reference") return;
			var GROUP = newGROUP4object(null,object, null); // no role!
			if(this.getTableCount() == 1) {
				var container = voTABLES[this.getTable(0).id];
				jQuery(container).prepend(GROUP);
			} else {
				mappingRESOURCE.appendChild(GROUP)
			}
		});
		return VOTABLE;
	};

	function getFIELD_id(tableId, column_rank)
	{
		return tableId+"_F"+column_rank;
	}
	
	function addFIELDs(TABLE, source)
	{
		var table = tablesManager.findTable(source.id);
		var id = jQuery(TABLE).attr("ID");
		jQuery.each(table.columns, function(){
			newFIELD(TABLE, this, getFIELD_id(id, this.rank));
		});
	}
	
	function newINFO(parent, name, value) 
	{
		var el = newElement(parent,"INFO");
		el.setAttribute("name",name);
		el.setAttribute("value",value);
	}
	function newFIELD(parent, column, ID)
	{
		var el = newElement(parent,"FIELD");
		el.setAttribute("name",column.name);
		el.setAttribute("datatype",column.datatype);
		if(column.datatype == "char") 	el.setAttribute("arraysize","*");
		el.setAttribute("xtype",column.xtype);
		el.setAttribute("ID",ID);
		return el;
	};
	function newPARAM(parent, name, datatype, vodml_role, value)
	{
		var el = newElement(parent,"PARAM");
		el.setAttribute("name",name);
		el.setAttribute("datatype",datatype);
		if(datatype == "char") 	el.setAttribute("arraysize","*");
		if(vodml_role) {
			addVODML(el,vodml_role,null);
		}
		el.setAttribute("value",value);
		return el;
	};
	function newFIELDref(parent, ref, vodml_role)
	{
		var el = newElement(parent,"FIELDref");
		el.setAttribute("ref",ref);
		if(vodml_role != null)addVODML(el,vodml_role,null);
		return el;
	};
	function newPARAMref(parent, ref, vodml_role)
	{
		var el = newElement(parent,"PARAMref");
		el.setAttribute("ref",ref);
		if(vodml_role != null)addVODML(el,vodml_role,null);
		return el;
	};
	function newGROUP(parent, vodml_role, vodml_type, id)
	{
		var el = newElement(parent,"GROUP");
		addVODML(el,vodml_role, vodml_type);
		if(id != null) el.setAttribute("ID",id);
		return el;
	};	
	
	function addVODML(el,role, type) {
//		if(type == null && role == null) // ERROR
		var vodml = newElement(el,"VODML");
		if(role != null) {
//			vodml.setAttribute("role",role);
			jQuery(newElement(vodml,"ROLE")).text(role);
			if(type == null)
			{
				var el = modelsManager.find(role);
				type = jQuery(el).find(">datatype>vodml-ref");
				type = type.text();
			}
		}
		jQuery(newElement(vodml,"TYPE")).text(type);
//        vodml.setAttribute("type",type);
	}
	
	function newGROUPref(parent, vodmlref, refid)
	{
		var el = newElement(parent,"GROUP");
		addVODML(el,vodmlref,null);
		if(refid != null) el.setAttribute("ref",refid);
		return el;
	};	
	function newTABLE(parent, id)
	{
		var el = newElement(parent,"TABLE");
		el.setAttribute("ID",id);
		return el;
	};	
	// vodmlref is vodmlref of role the object plays, may be null for root objects!
	// 
	function newGROUP4object(parent, object, vodmlref)
	{
		var GROUP = newGROUP(parent,vodmlref,object.vodmlref,object.id);
		var GROUPNode = graph.getNode(object.id); // node represented by GROUP
		
		doneObjects[object.id] = GROUP;

		// TODO find as_constant attributes, turn into PARAM-s
		jQuery.each(object.literals, function()
		{
			var role = modelsManager.find(this.vodmlref);
			var name = jQuery(role).find(">name").text()
			var datatype = votabletype4datatype(jQuery(role).find(">datatype").text().trim());
			newPARAM(GROUP,name, datatype,this.vodmlref, this.value);
		});
		
		var maps = jQuery.grep(mapperState.mapper.maps, function(m){
			return(m.from.objectId==object.id);
		});
		// decide whether group maps to single table !
		jQuery.each(maps, function(){
			var role = this.from.role; // may be null for instance->table mapping 
			var to = this.to;
			if( to.connectorType == "table"){
				// dop nothing
			}
			else if(to.connectorType == "tableColumn")
			{
				var fieldid = getFIELD_id(to.tableId, to.column.rank);
				newFIELDref(GROUP,fieldid,role.vodmlref);
			} else {
				var targetId = to.objectId;
				var targetNode = graph.getNode(targetId);
				var targetObject = targetNode.object;
				var targetType = to.type;
				if (doneObjects[targetId] != null || this.from.connectorType == "reference") {
					// if a reference is ok
					if(to.connectorType == "reference")
					{
						if(targetType.vodmlref == "vo-dml:Reference")
						{
							newGROUP4object(GROUP, targetObject, role.vodmlref);
//							alert("Use of 'vo-dml:Reference' not yet supported");
						} else {
							// assume the target GROUP will be built
							var ref = newGROUP(GROUP, role.vodmlref, null, null);
							ref.setAttribute("ref",targetId);
						}
					} else {
						alert("System/logic error: A non-reference relation points to object built before owner!");
						// TODO more info
					}
				} else {
					if (to.connectorType == "dataType" && this.from.connectorType == "dataType") {
						newGROUP4object(GROUP, targetObject, role.vodmlref);
					} else if(to.connectorType == "primitiveType" || to.connectorType == "enumeration"){
						newPARAM4attribute(GROUP, role, targetObject);
					} else if(to.connectorType == "composition"){
						// TODO check to make sure current GROUP is in same table, or both not in table, to decide whether
						// current GROUP is truly parent
						var parentTable = GROUPNode.getTable(0);
						var childTable = targetNode.getTable(0);

//						var compositionGroup = getCompositionGROUP(GROUP,role.vodmlref);
//						var collectionItem = "vo-dml:Composition.item";
						var compositionGroup = GROUP;
						var compositionItem = role.vodmlref;
						
						if(parentTable == childTable){
							newGROUP4object(compositionGroup, targetObject, compositionItem);
						}
						else if(parentTable == null)
						{
							var childGROUP = newGROUP4object(null, targetObject, null);
							var container = voTABLES[childTable.id];
							jQuery(container).prepend(childGROUP);
							newGROUPref(compositionGROUP,  compositionItem, targetId);
							// TODO add contaianer pointer GROUPref?
							newGROUPref(childGROUP, "vo-dml:ObjectInstance.CONTAINER", object.id);
						} else if(childTable == null)
						{
							alert("Illegal composition declaration between a parent in a table, and a singleton child");
							// TODO illegal, row(s) in table cannot be declared to contain singleton GROUP
						} else {
							alert("Illegal direct composition declaration between a parent and child in different tables. <br/>" +
									"Use a vo-dml:Reference to define a foreign key from child to parent table.");
							// TODO illegal? should parent-child relation between distinct tables use a 
							//    vo-dml:Reference from the CONTAINER field?  
						}
					} else {
						alert("Can currently not deal with connectorType " + this.from.connectorType);
					}
				}
			};
		});
		return GROUP;
	};	

	/* get GROUP with VODML role indicated by specified vodmlref */
	/* used in mapping mode where each composition has its own child grup.
	 * THIS IS NO LONGER PROPOSED
	 */
	function getCompositionGROUP(parent, vodmlref) {
		var compositionGROUP = jQuery(parent).find(">GROUP>VODML>ROLE='"+vodmlref+"']");
		if(compositionGROUP != null && compositionnGROUP.length == 1)
		{
	return compositionGROUP[0];
		} else {
			return newGROUP(parent,vodmlref,null, null);
		}
		
	}
	
  function newPARAM4attribute(GROUP, role, target)
  {
	  // todo, some type translation?
	  var PARAM = newPARAM(GROUP,role.name, votabletype4datatype(role.datatype), role.vodmlref,target.value);
	  // TODO check whether arraysize and/or xtype should be set
  };
  
  function votabletype4datatype(vodmlref)
  {
	  if(vodmlref == "ivoa:string") return "char";
	  else if(vodmlref == "ivoa:integer") return "int";
	  else if(vodmlref == "ivoa:real") return "float";
	  else  return "char";
  };
  function votabletype4adqltype(adqltype)
  {
	  var xtype = adqltype.toLowerCase();
	  if(xtype == "adql:char" 
		  || xtype == "adql:varchar" 
		  || xtype == "adql:date" 
		  || xtype == "adql:time"
		  || xtype == "adql:timestampe"
		  || xtype == "adql:clob") return "char";
	  else if(xtype == "adql:integer") return "int";
	  else if(xtype == "adql:smallint") return "short";
	  else if(xtype == "adql:bigint") return "long";
	  else if(vodmlref == "adql:real") return "float";
	  else if(vodmlref == "adql:float") return "double";
	  else  return "char";
  };
};