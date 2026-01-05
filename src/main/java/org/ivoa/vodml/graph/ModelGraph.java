package org.ivoa.vodml.graph;

import java.net.URL;
import java.util.ArrayList;
import java.util.Hashtable;

import org.ivoa.vodml.VODMLManager;
import org.ivoa.vodml.jaxb.DataType;
import org.ivoa.vodml.jaxb.Enumeration;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ObjectType;
import org.ivoa.vodml.jaxb.Package;
import org.ivoa.vodml.jaxb.PrimitiveType;
import org.ivoa.vodml.jaxb.Role;

public class ModelGraph extends ArrayList<ObjectTypeNode>{
	
	private boolean NODES_INITALIZED = false;
	private boolean ROLES_RESOLVED = false;
	
	private Model model;
	private ModelNode modelNode;
	private String modelURL;
	private VODMLManager vodml;
	private Hashtable<String, ElementNode> elements;
	private Hashtable<String, TypeNode> types;

	public ModelGraph(VODMLManager _models, Model _model, String _modelURL){
		this.vodml  = _models;
		this.model = _model;
		this.modelURL = _modelURL;
		this.elements = new Hashtable<String, ElementNode>();
		this.types = new Hashtable<String, TypeNode>();
	}

	public void initModel() {
		if(NODES_INITALIZED)
			return;
		this.modelNode = new ModelNode(model, getModelURL(), this);
		for (ObjectType t : model.getObjectType())
			new ObjectTypeNode(t,this);
		for (DataType t : model.getDataType())
			new DataTypeNode(t, this);
		for (PrimitiveType t : model.getPrimitiveType())
			new PrimitiveTypeNode(t, this);
		for (Enumeration t : model.getEnumeration())
			new EnumerationNode(t, this);
		for (Package p : model.getPackage())
			initPackage(p);
		this.NODES_INITALIZED = true;
	}
	

	private void initPackage(Package p) {
		new PackageNode(p,this);
		for (ObjectType t : p.getObjectType())
			new ObjectTypeNode(t,this);
		for (DataType t : p.getDataType())
			new DataTypeNode(t, this);
		for (PrimitiveType t : p.getPrimitiveType())
			new PrimitiveTypeNode(t, this);
		for (Enumeration t : p.getEnumeration())
			new EnumerationNode(t, this);
		for (Package cp : p.getPackage())
			initPackage(cp);
	}

	public ElementNode getElementForVODMLREF(String vodmlref)
	{
		return elements.get(vodmlref);
	}

	public void resolveRoles()
	{
		if(ROLES_RESOLVED)
			return;
		if(!NODES_INITALIZED)
			throw new IllegalStateException("Nodes must have beeen initializaed before resolving roles");
		for(TypeNode tn: types.values() )
			tn.resolveRoles();
		ROLES_RESOLVED = true;
	}
	
	public Model getModel() {
		return model;
	}
	/**
	 * 
	 * @param role
	 * @return
	 */
	public TypeNode getType(Role role)
	{
		// first check local
		String utype = role.getDatatype().getVodmlRef();
		TypeNode tn = types.get(utype);
		if(tn != null)
			return tn;
		else // check VO-DML model manager
			return vodml.findType(utype);
	}

	public VODMLManager getVodml() {
		return vodml;
	}
	public void register(ElementNode node)
	{
		if(node != null)
		{
			String utype = node.getVODMLREF();
			if(utype != null)
				this.elements.put(utype, node);
			if(node instanceof TypeNode)
			{
				types.put(utype, (TypeNode)node);
				if(node instanceof ObjectTypeNode)
					add((ObjectTypeNode)node);
			}
		}
	}

	public String getModelURL() {
		return modelURL;
	}

	public ModelNode getModelNode() {
		return modelNode;
	}

}
