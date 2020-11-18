package org.ivoa.vodml;

import graphs.DirectedGraph;
import graphs.Node;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;


import org.ivoa.vodml.graph.AttributeNode;
import org.ivoa.vodml.graph.ElementNode;
import org.ivoa.vodml.graph.ModelGraph;
import org.ivoa.vodml.graph.ObjectTypeNode;
import org.ivoa.vodml.graph.ReferenceNode;
import org.ivoa.vodml.graph.RoleNode;
import org.ivoa.vodml.graph.StructuredTypeNode;
import org.ivoa.vodml.graph.TypeNode;
//import org.ivoa.vodml.instance.jaxb.ModelLocation;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ModelImport;
import org.ivoa.vodml.jaxb.Models.Modellocation;


/**
 * Manages VO-DML models. Is able to retrieve them and manage each.
 * Build a single data structure for all required models.
 * @author GerardLemson
 *
 */
public class VODMLManager extends ArrayList<Modellocation> 
{

	/**
	 * 
	 */
	private static final long serialVersionUID = -5963181083012981591L;

	private VODMLRegistry vodmlReg;
	/** models keyed by url, to quickly see whether a model has been loaded */
	private Hashtable<String,Modellocation> models_url;
	/** models keyed by their utype */
	private Hashtable<String,Modellocation> models_by_name;


	 /** 
	 * This should be an ivoa identifier, currently the Model's name is used. */
	private Hashtable<String,ModelGraph> modelgraphs;

	/** utypes keyed by (possibly alternative) prefixes*/
	private Hashtable<String,String> utype_prefixes;
	/** truncated model urls keyed by utype */
	private Hashtable<String,String> utype_url;
	/** Graph of objectype nodes */
	private DirectedGraph<ObjectTypeNode, RoleNode> objectTypeGraph; 


	public VODMLManager(String name, String url) {
		this(new RemoteVODMLRegistry(), name, url);
	}
	public VODMLManager(VODMLRegistry reg, String name, String url)
	{
		this.vodmlReg = reg; // TODO check it's not null
		ArrayList<Modellocation> ms = new ArrayList<Modellocation>();
		Modellocation ml = new Modellocation();
		ml.setName(name);
		ml.setLocation(url);
		ms.add(ml);
		try {
			initialize(ms);
		} catch(Exception e)
		{
			System.out.println("Unable to load VO-DML models");
			e.printStackTrace();
		}

	}

	/**
	 * Constructor for a set of VO-DML data models.<br/>
	 * Will download all of the models and parse them to a JAXB object. 
	 * Will order the models based on their import relationship.
	 * Will build ModelGraphs in that order, so as to satisfy type relationships.
	 * @param _models
	 */
	public VODMLManager(VODMLRegistry reg, List<Modellocation> _models) 
	{
		this.vodmlReg = reg;
		try {
			initialize(_models);
		} catch(Exception e)
		{
			System.out.println("Unable to load VO-DML models");
			e.printStackTrace();
		}
	}
	
	private void initialize(List<Modellocation> _models) throws Exception
	{
		models_by_name = new Hashtable<String, Modellocation>();
		models_url = new Hashtable<String, Modellocation>();

		utype_prefixes = new Hashtable<String, String>();
		utype_url = new Hashtable<String, String>();
		modelgraphs = new Hashtable<String, ModelGraph>();


//		loadModels(VODML_url, "vo-dml"); // must be after initialisation of data structures
		for(Modellocation _m: _models)
			loadModels(_m.getName(), _m.getLocation());
		
		buildGraphs();
		
	}

	/**
	 * Load model identified by URL and using given prefix
	 * TODO add check that same model will never be attempted to be loaded with different prefix, 
	 * or allow multiple prefixes to point to same model.
	 * @param url
	 * @param prefix
	 * @throws Exception
	 */
	private Modellocation loadModel(String name, String url) throws Exception
	{
		Modellocation m = models_url.get(url);
		if(m != null) // already loaded
			return m;
		m = vodmlReg.openModel(name, url);
		return m;
	}
	/**
	 * Load model identified by URL and using given prefix and all models it imports.
	 * TODO check for cycles.
	 * TODO add check that same model will never be attempted to be loaded with different prefix, 
	 * or allow multiple prefixes to point to same model.
	 * @param url
	 * @param prefix
	 * @throws Exception
	 */
	private void loadModels(String name, String url) throws Exception
	{
		Modellocation m = (name == null?null:models_url.get(name));
		if(m == null)
		{
			// check whether maybe model was loaded with different URL already.
			// base on Model's utype, though an (ivo-)identifier should have been preferable. 
			m = loadModel(name, url);
			if(m == null)
				throw new IllegalStateException(String.format("N o model available for name/url = '%s'/'%s'",name,url));
			if(name == null) name = m.getName();
			Modellocation exm = models_by_name.get(m.getName()); 
			if(exm != null)
				models_url.put(url, exm);
			else
			{
				models_url.put(url, m);
				models_by_name.put(m.getName(), m);
				for(ModelImport mp: m.getModel().getImport())
				{
					Modellocation mi = models_url.get(mp.getUrl());
					if(mi == null)
						loadModels(mp.getName(), mp.getUrl());
				}
				this.add(m); // AFTER the imported models have been added!
			}
			addVODMLRef(name, name, url);
		}
		return ;
	}
	/**
	 * If the prefix yet exists for the given u
	 * @param utype
	 * @param prefix
	 * @return true if the utype is registered with the prefix, false otherwise. False might happen if the prefix already identifies another utype.
	 */
	private boolean addVODMLRef(String utype, String prefix, String url)
	{
		if(prefix == null)
			prefix = utype;
		utype_url.put(utype,url);
		String otherutype = utype_prefixes.get(prefix);
		if(otherutype == null)
		{
			utype_prefixes.put(prefix, utype);
			return true;
		} else
			return otherutype.equals(utype);
		
	}

	/**
	 * Return the VO-DML ReferencableElement for the indicated utype.<br/>
	 * Currently a simple lookup in a single hastable, may be made more flexible by first looking for Model based on prefix,
	 * then in model ask for utype without prefix. Allows variable prefixes
	 * @param utype
	 * @return
	 */
	public ElementNode findReferableElement(String vodmlref) {
		ModelGraph model = findModelForUtype(vodmlref);
		if(model == null)
			return null;
		return model.getElementForVODMLREF(vodmlref);
	}

	public ModelGraph findModelForUtypePrefix(String prefix) {
		return modelgraphs.get(prefix);
	}

	public ModelGraph findModelForUtype(String vodmlref) {
		String prefix = VODMLREF.getPrefix(vodmlref);
		return findModelForUtypePrefix(prefix);
	}
	public ModelGraph findModelForURL(String url) {
		Modellocation m = (url == null?null:models_url.get(url));
		return m == null?null:modelgraphs.get(m.getName());
	}
	
	public TypeNode findType(String utype)
	{
		ElementNode node = findReferableElement(utype);
		if(node instanceof TypeNode)
			return (TypeNode)node;
		else
			return null;
	}
	public ObjectTypeNode findContainer(ObjectTypeNode ot)
	{
		ObjectTypeNode container = null;
		// TODO implement
		return container;
	}
	public TypeNode findTypeForRole(RoleNode rn)
	{
		String utype = rn.getRole().getDatatype().getVodmlRef();
		ElementNode node = findReferableElement(utype);
		if(node instanceof TypeNode)
			return (TypeNode)node;
		else
			return null;
	}
	/**
	 * Check whether the specified type is a valid type for instances of the given role.
	 * I.e. it must be the datatype of the role or one of its subclasses
	 * @param role
	 * @param type
	 * @return
	 */
	public boolean areRoleTypeCompatible(RoleNode role, TypeNode type)
	{
		if(role == null || type == null)
			return true;
//		if(role instanceof RelationNode && VODMLREF.isIdentifier(type.getVODMLREF()))
//			return true;
//		if(role instanceof ReferenceNode && VODMLREF.isReference(type.getVODMLREF()))
//			return true;
//		if(VODMLREF.isTypeInstance(role.getVODMLREF()))
//			return true;
//		if(VODMLREF.isObjectTypeInstance(role.getVODMLREF()) && type instanceof ObjectTypeNode)
//			return true;
//		if(VODMLREF.isDataTypeInstance(role.getVODMLREF()) && type instanceof DataTypeNode)
//			return true;
		
		TypeNode datatype = findTypeForRole(role);
		TypeNode currentType = type;
		while(currentType != null)
		{
		    if(datatype == currentType)
		    	return true;
		    currentType = currentType.getSuperType();
		}
		
			
		// special checks: container and reference are allowed to use vodml-map:Identifier as type!
		// TBD could put this on utypeattr, add the actual declared type of the role, but indicate 
		// it is indirectly referenced through a vodml-map:Identifier
    	return false;
	}
	
	public void buildGraphs()
	{
		this.objectTypeGraph = new DirectedGraph<ObjectTypeNode, RoleNode>();
		// Should be able to treat model s in order
		for(Modellocation m: this)
		{
			ModelGraph mg = new ModelGraph(this,m.getModel(), getModelUrl(m.getName()));
			modelgraphs.put(m.getName(), mg);
			mg.initModel();
			for(ObjectTypeNode ot: mg)
				objectTypeGraph.addNode(new Node<ObjectTypeNode>(ot.getVODMLREF(), ot));
		}

		for(ModelGraph mg: this.modelgraphs.values())
			mg.resolveRoles();

		// add edges
		for(Node<ObjectTypeNode> node: objectTypeGraph.getNodes())
		{
			ObjectTypeNode ot = node.getObject();
			if(ot.getContainer() != null)
				addEdge(node, ot.getContainer());
			Hashtable<String,TypeNode> visited = new Hashtable<String, TypeNode>();
			addEdges(node, ot, visited);
		}
		objectTypeGraph.sort();
	}

	public String getModelUrl(String utype)
	{
		String prefix = VODMLREF.getPrefix(utype);
		return utype_url.get(prefix);
	}
	private void addEdges(Node<ObjectTypeNode> node, StructuredTypeNode st, Hashtable<String,TypeNode> visited)
	{
		Iterator<ReferenceNode> refs = st.getReferences();
		if(refs != null){
			while(refs.hasNext())
				addEdge(node, refs.next());
		}
/*
 * TODO need to take care of cycles in datatypes here 
 * If a datatype with reference at some point   
 */
		Iterator<AttributeNode> atts = st.getAttributes();
		if(atts == null) return;
		while(atts.hasNext())
		{
			TypeNode at = atts.next().getDatatype();
			if(at instanceof StructuredTypeNode && visited.get(at.getVODMLREF()) == null)
			{
				visited.put(at.getVODMLREF(), at);
				addEdges(node, (StructuredTypeNode)at, visited);
			}
		}
	}

	
	/** Add edge from fromNode to target of Role, and to all subclasses of the target */
	private void addEdge(Node<ObjectTypeNode>  fromNode, RoleNode role)
	{
		ObjectTypeNode target = (ObjectTypeNode)role.getDatatype();
		if(target == null)
			throw new IllegalStateException(String.format("Can not find ObjectTypeNode for role '%s'",role.getVODMLREF()));

		addEdge(fromNode, role, target);
	}
	/** Recursive! also add edge to all subtypes.<br/> */
	private void addEdge(Node<ObjectTypeNode>  fromNode, RoleNode role, ObjectTypeNode target)
	{
		objectTypeGraph.addEdge(fromNode, target.getVODMLREF(), role);
		Iterator<TypeNode> subclasses = target.getSubClasses();
		while(subclasses.hasNext())
			addEdge(fromNode, role, (ObjectTypeNode)subclasses.next());
	}
	
	/**
	 * Remove scheme from the URL.<br/>
	 * Poor man's way to ensure https and http access to same volute resource is recognized as being the same.
	 * Should have ivoId in data model.
	 * @param url
	 * @return
	 */
	public static String truncateURL(String url)
	{
		int index = url.indexOf(":");
		if(index < 0)
			return url;
		return url.substring(index);
	}

	public DirectedGraph<ObjectTypeNode, RoleNode> getObjectTypeGraph() {
		return objectTypeGraph;
	}
	

}
