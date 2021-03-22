// java script code to assist in interpreting a set of VO-DML models
/*
Special VO-DML vodmlrefs used:

vo-dml:ORMReference
vo-dml:ORMReference.target
vo-dml:RemoteReference
vo-dml:ObjectType
vo-dml:ObjectInstance
 */


/* manager of models */
var VODML = function() {

	var that = this;
	this.xmlDoc;
	this.models = new Object();  // models 
	this.models_url = new Object();
	this.allPaths = new Array(); // types by path name, sorted, for use in autocomplete
	this.allTypes = new Object(); // types indexed by vodmlref
	this.allTypesByPath = new Object(); // types indexed by path
	this.subtypes = new Object(); // for each super type an array of subtypes
	

	this.addSubType = function(supertype, subtype) {
		var list = that.subtypes[supertype];
		if(list == null) {
			list = new Array();
			that.subtypes[supertype] = list;
		}
		if(list.indexOf(subtype) == -1){
            list.push(subtype);
        }
	};
	
	this.findTypeHierarchy = function(vodmlref) {
		var list = new Array();
		findSubTypes(vodmlref, list);
		return list;
	};
	function findSubTypes(vodmlref, list)
	{
		list.push(vodmlref);
		var subtypes = that.subtypes[vodmlref];
		if(subtypes != null) {
			jQuery.each(subtypes, function(index, item) {
				findSubTypes(item, list);
			});
		}
	}
	
	this.addType = function(type){
		that.allPaths.push(type.path);
		that.allTypes[type.vodmlref] = type;
		that.allTypesByPath[type.path] = type;
		
		that.subtypes
	};
	this.getAllTypes = function(){
		return that.allTypes;
	};
	this.getAllPaths = function(){
		return that.allPaths;
	};
	this.findType = function(vodmlref){
		return that.allTypes[vodmlref];
	};
	this.findType4Path = function(path){
		return that.allTypesByPath[path];
	};
	this.getModelNames = function(){
		var am = new Array();
		jQuery.each(that.models, function(key,value){
			am.push(key);
		});
		return am;
	};
	// get all models in an array
	this.getModels = function(){
		var am = new Array();
		jQuery.each(that.models, function(key,value){
			am.push(value);
		});
		return am;
	};
	
	this.addModels = function(xml) {
		that.xmlDoc = jQuery(jQuery.parseXML(xml));
		var _models = that.xmlDoc.find(">models");
		var newModels = new Array();
		jQuery(_models).find(">modellocation").each(function() {
			var location = jQuery(this).find(">location").text(); 
			var documentation = jQuery(this).find(">documentationURL").text(); 
			var modelJDOM = jQuery(jQuery(this).find(">model")); 
			var name = modelJDOM.find(">name").text();
			if (that.models[name] == null) {
				var model = new Model(location, documentation, that);
				model.init(modelJDOM);
				that.models[model["name"]] = model;
				that.models_url[location] = model;
				newModels.push(model);
			}
		});
		return newModels;
	};
	
	this.clearAll = function(){
		that.models = new Object();
		that.models_url = new Object();
		that.allPaths = new Array();
		that.allvodmlrefs = new Array();
		that.allTypes = new Object();
	};
	/**
	 * Return DOM element representing vo-dml:model with given name. 
	 */
	this.findModel = function(name)
	{
		var model = that.models[name];
		if(model != null)
			return model.model;
		else
			return null;
	};

	this.model4vodmlref = function(vodmlref)
	{
		var ix = vodmlref.indexOf(":");
		var modelname=(ix==-1?vodmlref:vodmlref.substring(0,ix));
		return that.models[modelname];
	};
	/**
	 * Return DOM element indicated by given vodmlref. 
	 */
	this.findVODMLElement = function(vodmlref)
	{
		vodmlref=vodmlref.trim();
		var ix = vodmlref.indexOf(":");
		var modelname=(ix==-1?vodmlref:vodmlref.substring(0,ix));
		var model = that.findModel(modelname);
		if(ix == -1 || model == null) return model;
		var vodmlid=vodmlref.substring(ix+1);
		var el = null;
		jQuery(model).find("vodml-id:contains('"+vodmlid+"')").each(function(){
			var txt = jQuery.trim(jQuery(this).text()); 
			if(txt == vodmlid)
			{
				el = jQuery(this).parent()[0];
				return false;
			}
		});
//		if(el != null && el.length > 0)	return el[0];
		return el;
	};
	// return a vodmlref of a type containing this type or its parent true if the type represented by the vodmlref is contained,
	// either directly or because a super type is contained
	//
	//
	this.findContainer = function(vodmlref)
	{
		var type = that.findVODMLElement(vodmlref);
		var container = null;
		// TODO next is not good enough as xmldoc may change. Must loop over all models ...
		jQuery(that.xmlDoc).find("objectType:has(>composition>datatype>vodml-ref:contains('"+vodmlref+"'))").each(function(){
			var c = jQuery(this)[0];
			var model = jQuery(c).closest("model")[0];
			container = jQuery(model).find(">name").text()+":"+jQuery(c).find(">vodml-id").text();
			return false;
		});
		if(container != null) return container;
		// find base class and get its roles first
		var _extends = jQuery(type).find(">extends");
		if (_extends != null && _extends.length > 0) {
			var supervodmlref = jQuery(_extends).find(">vodml-ref").text();
			return that.findContainer(supervodmlref);
		}
		return null;

	};
	/* check whether the specified type (identified by vodmlref)
	 * is compatible with the datatype of the specified role (identified by vodmlref) */
	this.checkRoleTypeCompatible = function(roleDatatype, typevodmlref)
	{
		return that.checkIsA(typevodmlref, roleDatatype);
	};
	this.checkIsA = function(typevodmlref, supervodmlref)
	{
		if(typevodmlref == supervodmlref) return true;
		var type = that.findVODMLElement(typevodmlref);
		var _extends = jQuery(type).find(">extends");
		if(_extends == null||_extends.length == 0) {
			if(type.tagName.toLowerCase() == "objecttype")
				return supervodmlref == "vo-dml:ObjectInstance";
			else return false;
		}
		var basevodmlref = jQuery(_extends).find(">vodml-ref").text();
		if(basevodmlref == null || basevodmlref == "") return false; // should throw error!
		return that.checkIsA(basevodmlref, supervodmlref);
			
	};
	this.findDatatype = function(role)
	{
		var vodmlref = jQuery(role).find(">datatype>vodml-ref").text();
		return that.findVODMLElement(vodmlref);
	};
	/* construct a vodmlref for a vodml element specified as a DOM element*/
};
var Model = function(loc, doc, vodml) {
	var that = this;
	this.vodml = vodml;
	this.model = null;
	this.name;
	this.description;
	this.title;
	this.location = loc;
	this.documentation = doc;
	this.packages = new Object();
	this.objectTypes = new Object();
	this.dataTypes = new Object();
	this.primitiveTypes = new Object();
	this.enumerations = new Object();
	this.allvodmlrefs = new Object();

	/* build a model from an XML string following the <vo-dml:model> */
	this.parse = function(xml) {
		var model = xml.find("vo-dml\\:model");
		that.init(model);
	};
	/* can be used to construct a Model from a vodml element */
	this.init = function(modelDoc) {
		that.model = modelDoc;
		that.name = that.model.find(">name").text();
		that.title = that.title;
		that.model.find(">objectType").each(function() {
			initObjectType(jQuery(this), that);
		});
		that.model.find(">dataType").each(function() {
			initDataType(jQuery(this), that);
		});
		that.model.find(">primitiveType").each(function() {
			initPrimitiveType(jQuery(this), that);
		});
		that.model.find(">enumeration").each(function() {
			initEnumeration(jQuery(this), that);
		});
		that.model.find(">package").each(function() {
			initPackage(jQuery(this), that);
		});
	};
	function initObjectType(jdom, container) {
		var objectType = new ObjectType(jdom, that);
		container.objectTypes[objectType.vodmlid] = objectType;
		that.allvodmlrefs[objectType.vodmlref] = objectType;
		
	};
	function initDataType(jdom, container) {
		var dataType = new DataType(jdom, that);
		container.dataTypes[dataType.vodmlid] = dataType;
		that.allvodmlrefs[dataType.vodmlref] = dataType;
	};
	function initPrimitiveType(jdom, container) {
		var primitiveType = new PrimitiveType(jdom, that);
		container.primitiveTypes[primitiveType.vodmlid] = primitiveType;
		that.allvodmlrefs[primitiveType.vodmlref] = primitiveType;
	};
	function initEnumeration(jdom, container) {
		var enumeration = new Enumeration(jdom, that);
		container.enumerations[enumeration.vodmlid] = enumeration;
		that.allvodmlrefs[enumeration.vodmlref] = enumeration;
	};
	function initPackage(jdom, container) {
		var pack = new Package(jdom, that);
		container.packages[pack.vodmlid] = pack;
		that.allvodmlrefs[pack.vodmlref] = pack;
		jdom.find(">objectType").each(function() {
			initObjectType(jQuery(this), pack);
		});
		jdom.find(">dataType").each(function() {
			initDataType(jQuery(this), pack);
		});
		jdom.find(">primitiveType").each(function() {
			initPrimitiveType(jQuery(this), that);
		});
		jdom.find(">enumeration").each(function() {
			initEnumeration(jQuery(this), that);
		});
		jdom.find(">package").each(function() {
			initPackage(jQuery(this), pack);
		});
	};
};

/**/

VODMLType = function(el, model)
{
	var that = this;
	this.model = model;
	this.name = el.find(">name").text();
	var d = el.find(">description"); 
	this.description = (d != null? d.text():null);
	
	this.vodmlid = el.find(">vodml-id").text();
	this.vodmlref = model.name + ":" + this.vodmlid;
	this.supertype = el.find(">extends>vodml-ref").text();
	if(this.supertype != "") {
		model.vodml.addSubType(that.supertype, that.vodmlref);
	}
	this.path = model.name+":"+pathFor(el);
	if(el[0].nodeName != 'package'){
		model.vodml.addType(this);
	}	
	function pathFor(el){
		var path = that.name;
		var packages = jQuery(el).parents('package');
		jQuery.each(packages, function(index, value){
			var pckg = jQuery(packages[index]);
			path = pckg.find('>name').text()+"."+path;
		});
		return path;
	}
};
VODMLType.prototype = {
		test_alert:function(){
			alert("I am a VODMLType");
		}
};
ObjectType = function(el,model){
	ObjectType.baseConstructor.call(this,el,model);
};
DataType = function(el,model){
	DataType.baseConstructor.call(this,el,model);
};
PrimitiveType = function(el,model){
	PrimitiveType.baseConstructor.call(this,el,model);
};
Enumeration = function(el,model){
	Enumeration.baseConstructor.call(this,el,model);
};
Enumeration = function(el,model){
	Enumeration.baseConstructor.call(this,el,model);
};
var Package = function(el, model) {
	Enumeration.baseConstructor.call(this,el,model);
	this.objectTypes = new Object();
	this.dataTypes = new Object();
	this.primitiveTypes = new Object();
	this.enumerations = new Object();
	this.packages = new Object();

};
Inheritance_Manager.extend(ObjectType, VODMLType);
Inheritance_Manager.extend(DataType, VODMLType);
Inheritance_Manager.extend(PrimitiveType, VODMLType);
Inheritance_Manager.extend(Enumeration, VODMLType);
Inheritance_Manager.extend(Package, VODMLType);

