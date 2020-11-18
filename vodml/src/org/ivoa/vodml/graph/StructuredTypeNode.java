package org.ivoa.vodml.graph;



import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.Attribute;
import org.ivoa.vodml.jaxb.DataType;
import org.ivoa.vodml.jaxb.Enumeration;
import org.ivoa.vodml.jaxb.ObjectType;
import org.ivoa.vodml.jaxb.Package;
import org.ivoa.vodml.jaxb.PrimitiveType;
import org.ivoa.vodml.jaxb.Reference;
import org.ivoa.vodml.jaxb.Role;
import org.ivoa.vodml.jaxb.Type;



/** Represents an ObjectType in the ModelGraph */
public abstract class StructuredTypeNode extends TypeNode{
	
	private ArrayList<AttributeNode> attributes;
	private ArrayList<ReferenceNode> references;
	public StructuredTypeNode(Type t, ModelGraph vodml)
	{
		super(t, vodml);
		attributes = new ArrayList<AttributeNode>();
		references = new ArrayList<ReferenceNode>();
	}

	protected void addAttribute(Attribute a)
	{
		AttributeNode node = new AttributeNode(a, this, getModelGraph());
		attributes.add(node);
		addRole(node);
	}
	protected void addReference(Reference a)
	{
		ReferenceNode node = new ReferenceNode(a, this, getModelGraph());
		references.add(node);
		addRole(node);
	}

	@Override
	public RoleNode getRole(String utype) {
		
		return super.getRole(utype);
	}

	public Iterator<AttributeNode> getAttributes() {
		return attributes == null?null:attributes.iterator();
	}

	public Iterator<ReferenceNode> getReferences() {
		return references == null?null:references.iterator();
	}

}
