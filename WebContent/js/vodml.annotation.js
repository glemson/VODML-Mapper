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
var VOTABLE_NAMESPACE = "http://www.ivoa.net/xml/VOTable/v1.4_vodml";
VODML2VOTableAnnotator = function(tablesManager, modelsManager,exportDATA = false)
{
	var doc = null, mapperState = null, graph = null, voTABLES = null;
	var VOTABLE = null, VODML = null, GLOBALS=null, TEMPLATES=null, doneObjects = new Object();
	var usedModels = null;

	// XML handling
	function newElement(parent, name)
	{
		var el = doc.createElement(name);
		if(parent != null)parent.appendChild(el);
		return el;
	};
	function addTextChild(parent, name, value)
	{
		var el = newElement(parent, name);
		el.textContent = value;
		return el;
	};
	this.toVOTable = function(_mapperState)
	{
		// initialize "global" variables
		doc = document.implementation.createDocument(null, "VOTABLE", null);
		voTABLES = new Object();
		templates = new Object();
		graph = new MapperGraph(_mapperState);
		usedModels = new Object();
		
		mapperState = _mapperState;
		VOTABLE = doc.firstChild;
		VOTABLE.setAttribute("xmlns",VOTABLE_NAMESPACE);
		VOTABLE.setAttribute("xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance");
		VOTABLE.setAttribute("xsi:schemaLocation","http://www.ivoa.net/xml/VOTable/v1.4_vodml https://volute.g-vo.org/svn/trunk/projects/dm/vo-dml-org/xsd/ext/VOTable-1.4_vodml.xsd");
		
		VODML = newElement(VOTABLE,"VODML")
// ---
		// only necessary for unconnected mapping INSTANCES
		// check with graph whether such exist.
		GLOBALS = newElement(VODML,"GLOBALS")

		// always create a RESOURCE as VOTABLE must have at least one of those.
		tablesRESOURCE = newElement(VOTABLE, "RESOURCE")

		if (graph.tables.length > 0) {
			// only if a table exists, check with graph

			jQuery.each(graph.tables, function() {
				var table = this.object;

				var tableTEMPLATES = newElement(VODML, "TEMPLATES");
				tableTEMPLATES.setAttribute("tableref",table.id)
				templates[table.id] = tableTEMPLATES
				
				var TABLE = newTABLE(tablesRESOURCE, table.id);
				voTABLES[table.id] = TABLE;
				var info = table.source;
				newINFO(TABLE, "type", info.type);
				if (info.type == "TAP_TABLE") {
					newINFO(TABLE, "name", info.name);
					newINFO(TABLE, "tap_endpoint", info.tap_endpoint);
					addFIELDs(TABLE, info);
				} else if (info.type == "VOTABLE") {
					if(info.original_name){
						TABLE.setAttribute("name",info.original_name);
					}
					newINFO(TABLE, "votable_url", info.votable_url);
					newINFO(TABLE, "table_rank", info.table_rank);
					if (info.xmlid)
						newINFO(TABLE, "ID", info.xmlid);
					addFIELDs(TABLE, info);
					if(exportDATA) {
						addDATA(info, TABLE);
					}
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
				|| object.vodmlref == "vo-dml:ORMReference"
				|| object.vodmlref == "vo-dml:RemoteReference") return;
			var INSTANCE = newINSTANCE(null,object); // no role!
			if(this.getTableCount() == 1) {
				var container = templates[this.getTable(0).id];
				container.appendChild(INSTANCE);
			} else {
				GLOBALS.appendChild(INSTANCE);
			}
		});
		if(GLOBALS.childElementCount == 0){
			GLOBALS.parentNode.removeChild(GLOBALS);
		}
		
		jQuery.each(mapperState.models,function(key,value){
			if(value.name != "vo-dml" && value.name in usedModels){
				var model = newModelDeclaration(null, value);
				VODML.insertBefore(model,VODML.children[0]);
			}
		});
		
		return VOTABLE;
	};

	function newModelDeclaration(vodml, model){
		MODEL = newElement(vodml,"MODEL")
		addTextChild(MODEL,"NAME",model.name)
		addTextChild(MODEL,"URL",model.url)
		if(model.identifier){
			addTextChild(MODEL,"IDENTIFIER",model.identifier)
		}
		return MODEL;
	}
	
	
	// find role for given vodmlref
	// represent it as an Object mimicking
	function roleObject(vodmlref){
		var ROLE = new Object();
		var j_role = jQuery(modelsManager.find(this.vodmlref));
		ROLE.name = j_role.find(">name").text()
		ROLE.vodmlref=vodmlref
		ROLE.datatype = j_role.find(">datatype").text().trim();

		return ROLE;
	}
	
	function addDATA(source,TABLE){
		var table = tablesManager.findTable(source.id);
		if(table.DATA != null){
			table.DATA.namespaceURI=VOTABLE_NAMESPACE;
			TABLE.appendChild(table.DATA);
		}
	}	
	
	function registerModel(vodmlref){
		var pref=vodmlref.substr(0,vodmlref.indexOf(":"));
		if(!(pref in usedModels)){
			usedModels[pref]=pref;
		}
	}
	
	// vodmlref is vodmlref of role the object plays, may be null for root objects!
	// 
	function newINSTANCE(parent,object)
	{
		var INSTANCE_BUFFER = newElement(parent,"INSTANCE")
		INSTANCE_BUFFER.setAttribute("dmtype",object.vodmlref)
		registerModel(object.vodmlref);
		
		if(object.vodmltype == "objectType") INSTANCE_BUFFER.setAttribute("ID",object.id)
		var INSTANCE= null; // dummy object, used 
		var node = graph.getNode(object.id); // node represented by GROUP
		
		doneObjects[object.id] = INSTANCE_BUFFER;
		// next is not necessary, can query INSTANCE
		// need to present children in correct order, hence first fill arrays, later add all to INSTANCE
		var primarykey=null;
		var container=null;
		var sameinstance=null;
		var attributes=new Object();
		var references=new Object();
		var collections = new Object();
		
		// TODO find as_constant attributes,
		jQuery.each(object.literals, function()
		{
			var ATTRIBUTE = newATTRIBUTE(INSTANCE,this.vodmlref,"LITERAL",this.value);
			attributes[this.vodmlref]=ATTRIBUTE;
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
				var fieldid = getFIELD_id(to.tableId, to.column)//.rank);
				if(role.vodmlref == "vo-dml:ObjectInstance.PRIMARYKEY"){
					// NB the target type MUST be an vo-dml:Identifier
					primarykey = newPRIMARYKEY(INSTANCE,"COLUMN",fieldid);
				}
				else { // check whether attribute already exists
					var attr = attributes[role.vodmlref];
					if (attr == null){
						attr=newATTRIBUTE(INSTANCE,role.vodmlref,"COLUMN",fieldid);
						attributes[role.vodmlref] = attr;
					} else{
						fillATTRIBUTE(attr,role.vodmlref,"COLUMN",fieldid);
					}
				}
			} else {
				var targetId = to.objectId;
				var targetNode = graph.getNode(targetId);
				var targetObject = targetNode.object;
				var targetType = to.type;
				if (doneObjects[targetId] != null || this.from.connectorType == "reference") {
					// if a reference is ok
					if(to.connectorType == "reference")
					{
						var ref = null;
						if(targetType.vodmlref == "vo-dml:ORMReference")
						{
							ref=newREFERENCE(INSTANCE, role.vodmlref, "FOREIGNKEY", targetNode);
						} else	if(targetType.vodmlref == "vo-dml:RemoteReference")
						{
							ref=newREFERENCE(INSTANCE, role.vodmlref, "REMOTEREFERENCE", targetObject);
						} else {
							// assume the target GROUP will be built
							ref = newREFERENCE(INSTANCE, role.vodmlref, "IDREF", targetId);
						}
						if(role.vodmlref == "vo-dml:ObjectInstance.CONTAINER"){
							container=ref;
						}else if(role.vodmlref == "vo-dml:ObjectInstance.SAMEINSTANCE"){
							sameinstance=ref;
						}
						else {
							references[role.vodmlref]=ref;
						}
					} else {
						alert("System/logic error: A non-reference relation points to object built before owner!");
						// TODO more info
					}
				} else {
					if (to.connectorType == "dataType" && this.from.connectorType == "dataType") {
						if(role.vodmlref == "vo-dml:ObjectInstance.PRIMARYKEY"){
							// NB the target type MUST be an vo-dml:Identifier
							primarykey = newPRIMARYKEY(INSTANCE,"INSTANCE",targetObject);
						}
						else {
							var attr = attributes[role.vodmlref];
							if(attr == null){
								attr = newATTRIBUTE(INSTANCE, role.vodmlref, "INSTANCE", targetObject);
								attributes[role.vodmlref]=attr;
							} else {
								fillATTRIBUTE(attr, role.vodmlref, "INSTANCE", targetObject);
							}
						}
					} else if(to.connectorType == "primitiveType" || to.connectorType == "enumeration"){
						if(role.vodmlref == "vo-dml:ObjectInstance.PRIMARYKEY"){
							// NB the target type MUST be an vo-dml:Identifier
							primarykey = newPRIMARYKEY(INSTANCE,"LITERAL",targetObject.value);
						}
						else {
							var attr = attributes[role.vodmlref];
							if(attr == null){
								attr=newATTRIBUTE(INSTANCE,role.vodmlref,"LITERAL",targetObject.value);
								attributes[role.vodmlref] = attr;
							} else{
								fillATTRIBUTE(attr, role.vodmlref,"LITERAL",targetObject.value);
							}
						}
					} else if(to.connectorType == "composition"){
						// TODO check to make sure current GROUP is in same table, or both not in table, to decide whether
						// current GROUP is truly parent
						var parentTable = node.getTable(0);
						var childTable = targetNode.getTable(0);

						var compositionParent = INSTANCE;
						var collection = collections[role.vodmlref];
						if(collection == null){
							collection = newCOMPOSITION(INSTANCE,role.vodmlref);
							collections[role.vodmlref] = collection;
						}
						
						if(parentTable == childTable){  // includes null==null ???
							newINSTANCE(collection, targetObject);
						}
						else if(parentTable == null)
						{
							if(childTable != null){ // EXTINSTANCES
								var extinstances = newEXTINSTANCES(collection,targetId);
							} 
							var childINSTANCE = newINSTANCE(null, targetObject);
							var _container = templates[childTable.id];
							_container.appendChild(childINSTANCE);
//							container = newCONTAINER(childINSTANCE, "IDREF", targetId, object.id);
						} else if(childTable == null)
						{
							alert("Illegal composition declaration between a parent in a table, and a singleton child");
							// TODO illegal, row(s) in table cannot be declared to contain singleton GROUP
						} else {
							alert("Illegal direct composition declaration between a parent and child in different tables. <br/>" +
									"Use a vo-dml:ORMReference to define a foreign key from child to parent table.");
							// TODO illegal? should parent-child relation between distinct tables use a 
							//    vo-dml:Reference from the CONTAINER field?  
						}
					} else {
						alert("Can currently not deal with connectorType " + this.from.connectorType);
					}
				}
			};
		});
		if(primarykey != null){
			INSTANCE_BUFFER.appendChild(primarykey)
		}
		if(sameinstance != null){
			INSTANCE_BUFFER.appendChild(sameinstance)
		}
		if(container != null){
			INSTANCE_BUFFER.appendChild(container)
		}
		for(vodmlref in attributes){
			registerModel(vodmlref);
			INSTANCE_BUFFER.appendChild(attributes[vodmlref])
		}
		for(vodmlref in collections){
			registerModel(vodmlref);
			INSTANCE_BUFFER.appendChild(collections[vodmlref])
		}
		for(vodmlref in references){
			registerModel(vodmlref);
			INSTANCE_BUFFER.appendChild(references[vodmlref])
		}
		return INSTANCE_BUFFER;
	};	

	
	function checkROLE(INSTANCE, roleType, vodmlref){
		var ROLE = jQuery(INSTANCE).children('[dmrole="'+vodmlref+'"]');
		if(ROLE == null || ROLE.length == 0){
			ROLE = newElement(INSTANCE,roleType)
			ROLE.setAttribute("dmrole",vodmlref)
		} else {
			ROLE=ROLE[0]
		}
		return ROLE;
	}
	function newPRIMARYKEY(INSTANCE, instancetype, value){
		var PK = newElement(INSTANCE,"PRIMARYKEY");
		fillKEY(PK,instancetype,value)
		return PK;
	}
	function newFOREIGNKEY(INSTANCE, ormref){
		var FK = newElement(INSTANCE,"FOREIGNKEY");
		var target = null;
		var maps = jQuery.grep(mapperState.mapper.maps, function(m){
			return(m.from.objectId==ormref.id);
		});
		// decide whether group maps to single table !
		jQuery.each(maps, function(){
			var role = this.from.role; // may be null for instance->table mapping 
			var to = this.to;
			if(to.connectorType == "tableColumn")
			{
				var fieldid = getFIELD_id(to.tableId, to.column)//.rank);
				fillKEY(FK,"COLUMN",fieldid);
			} else{
				var targetId = to.objectId;
				var targetNode = graph.getNode(targetId);
				var targetObject = targetNode.object;
				var targetType = to.type;
				if(role.vodmlref == "vo-dml:ORMReference.FOREIGNKEY"){
					fillKEY(FK,"INSTANCE",targetObject)
					
				} else if (role.vodmlref == "vo-dml:ORMReference.TARGET"){
	//				target=target[0]
					// target must be added at end, hence do not add to FK yet.
					target = addTextChild(null,"TARGETID",targetId)
				}
			}
		});
		if(target != null) FK.appendChild(target); // do this last
		return FK;

	}
	function fillKEY(KEY,  instancetype, value){
		if(instancetype == "INSTANCE"){
			addPKFIELDs(KEY,value)
		} else {
			var PKFIELD = newElement(KEY,"PKFIELD");
			newCOLUMN(PKFIELD,"ivoa:string",value)
		}
	}
	function fillPKFIELD(PKFIELD, instancetype, value){
		if (instancetype == "LITERAL"){
			newLITERAL(PKFIELD, "ivoa:string", value.value);
		} else if (instancetype == "COLUMN"){
			newCOLUMN(PKFIELD, "ivoa:string", value);
		} else if(instancetype == "CONSTANT"){
			alert("WARNING, VODML-Mapper cannot yet deal with CONSTANT as PKFIELD instance type.");
		} else {
			alert("system error, unknown ATTRIBUTE instance type '"+instancetype+"'");
		}

	}

	function newATTRIBUTE(INSTANCE,vodmlref, instancetype, value){
		var ATTRIBUTE = checkROLE(INSTANCE,"ATTRIBUTE",vodmlref);
		registerModel(vodmlref);
		return fillATTRIBUTE(ATTRIBUTE,vodmlref, instancetype, value);
	}
	function fillATTRIBUTE(ATTRIBUTE,vodmlref, instancetype, value){
		var role = modelsManager.find(vodmlref);
		var j_role=jQuery(role)		
		var datatype = j_role.find(">datatype").text().trim();
		if (instancetype == "LITERAL"){
			newLITERAL(ATTRIBUTE, datatype, value);
		} else if (instancetype == "COLUMN"){
			newCOLUMN(ATTRIBUTE, datatype, value);
		} else if (instancetype == "INSTANCE") {
			newINSTANCE(ATTRIBUTE, value);
		} else if(instancetype == "CONSTANT"){
			alert("WARNING, VODML-Mapper cannot yet deal with CONSTANT as ATTRIBUTE instance type.");
		} else {
			alert("system error, unknown ATTRIBUTE instance type '"+instancetype+"'");
		}
		return ATTRIBUTE;
	}

	function newLITERAL(parent, dmtype, value)
	{
	  var LITERAL = newElement(parent,"LITERAL");
	  LITERAL.setAttribute("dmtype",dmtype);
	  registerModel(dmtype);
	  LITERAL.setAttribute("value",value);
	  return LITERAL;
	};
	function newCOLUMN(parent, dmtype, value)
	{
	  var COLUMN = newElement(parent,"COLUMN");
	  COLUMN.setAttribute("dmtype",dmtype)
	  registerModel(dmtype);
	  COLUMN.setAttribute("ref",value)
	  return COLUMN
	};  
  
	function newCONTAINER(parent, reftype, target, collectionId)
	{
	  var CONTAINER = newElement(parent,"CONTAINER");
	  CONTAINER.setAttribute("ref",collectionId)
	  setREFERENCETarget(CONTAINER, reftype, target)
	  registerModel(reftype);
	  return CONTAINER
	}; 

	//===================================================================
	// PROVISIONAL
	//===================================================================
	function newSAMEINSTANCE(parent, reftype, target, collectionId)
	{
	  var SAMEINSTANCE = newElement(parent,"SAMEINSTANCE");
	  SAMEINSTANCE.setAttribute("ref",collectionId)
	  setREFERENCETarget(SAMEINSTANCE, reftype, target)
	  return SAMEINSTANCE
	}; 
	//===================================================================
	//===================================================================
	
	
	
	function newREFERENCE(parent,vodmlref, reftype, target){
		  var ELEMENT;
		  if (vodmlref  == "vo-dml:ObjectInstance.CONTAINER"){
			    ELEMENT = newElement(parent,"CONTAINER")
		  } else if(vodmlref  == "vo-dml:ObjectInstance.SAMEINSTANCE") {
		    ELEMENT = newElement(parent,"SAMEINSTANCE")
		  }
		  else {
		    ELEMENT = newElement(parent,"REFERENCE")
	    	  ELEMENT.setAttribute("dmrole",vodmlref)
	    	  registerModel(vodmlref);
		  }
		  setREFERENCETarget(ELEMENT, reftype, target)
		  return ELEMENT;
	}
	// this function can be reused for REFERENCE and CONTAINER
	function setREFERENCETarget(REFERENCE, reftype, target){
		if(reftype == "IDREF"){
			newIDREF(REFERENCE, target)
		} else if(reftype == "FOREIGNKEY"){
			newFOREIGNKEY(REFERENCE, target)
		} else if(reftype=="REMOTEREFERENCE"){
			newREMOTEREFERENCE(REFERENCE, target)
		}

	}
	function newIDREF(parent,targetId){
		var IDREF = addTextChild(parent, "IDREF", targetId);
		return IDREF;
	}
	function newEXTINSTANCES(parent,targetId){
		var EXTINSTANCES = addTextChild(parent, "EXTINSTANCES", targetId);
		return EXTINSTANCES;
	}
	// here the targetObject will be an ORMReference ... 
	function addPKFIELDs(KEY, object){
		// If the key has a literal field, there can be only one and then no maps
		if(object.literals != null && object.literals.length > 0) {
			jQuery.each(object.literals, function()	{
				var PKFIELD = newElement(KEY,"PKFIELD");
				fillPKFIELD(PKFIELD,"LITERAL",this.value);
			});
		}
		else {	
			var maps = jQuery.grep(mapperState.mapper.maps, function(m){
				return(m.from.objectId==object.id);
			});
			// decide whether group maps to single table !
			jQuery.each(maps, function(){
				var role = this.from.role; // may be null for instance->table mapping 
				var to = this.to;
				var PKFIELD = newElement(KEY,"PKFIELD");
				if(to.connectorType == "tableColumn")
				{
					var fieldid = getFIELD_id(to.tableId, to.column)//.rank);
					fillPKFIELD(PKFIELD,"COLUMN",fieldid);
				} else {
					var targetId = to.objectId;
					var targetNode = graph.getNode(targetId);
					var targetObject = targetNode.object;
					var targetType = to.type;
					if(to.connectorType == "primitiveType" || to.connectorType == "enumeration"){
						fillPKFIELD(PKFIELD, "LITERAL", targetObject);
					}
				};
			});
		}
	}
	// TBD whether REMOTEREFERENCEs should be dealt wqith differently, 
	// e.g. by an REFERENCE to a "proxy object" defined elsewhere in the document. 
	function newREMOTEREFERENCE(parent,target){
		jQuery.each(target.literals, function()
		{
			var REMOTEREFERENCE = addTextChild(parent, "REMOTEREFERENCE", this.value);
		});
	}
  
	function newCOMPOSITION(parent,vodmlref) {
		var role = modelsManager.find(vodmlref);
		var COMPOSITION = newElement(parent,"COMPOSITION")
		COMPOSITION.setAttribute("dmrole",vodmlref)
		return COMPOSITION;
	}
	
  // ==== non-VODML VOTable elements
	function getFIELD_id(tableId, column)//_rank)
	{
		if (column.hasOwnProperty('xmlid') && column.xmlid != null){
			return column.xmlid;
		} else if (column.type == "PARAM"){
			return tableId+"_P"+column.rank;
		} else {
			return tableId+"_F"+column.rank;
		}
	}
	
	function addFIELDs(TABLE, source)
	{
		var table = tablesManager.findTable(source.id);
		var id = jQuery(TABLE).attr("ID");
		jQuery.each(table.columns, function(){
			newFIELD(TABLE, this, getFIELD_id(id, this));
		});
	}
	
	
	function newINFO(parent, name, value) 
	{
		var el = newElement(parent,"INFO");
		el.setAttribute("name",name);
		el.setAttribute("value",value);
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
		if(column.arraysize != null) el.setAttribute("arraysize",column.arraysize);
		if(column.xtype != null) el.setAttribute("xtype",column.xtype);
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

	

	function newTABLE(parent, id)
	{
		var el = newElement(parent,"TABLE");
		el.setAttribute("ID",id);
		return el;
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