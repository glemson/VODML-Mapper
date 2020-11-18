package org.ivoa.vodml.graph;

import java.util.ArrayList;
import java.util.Iterator;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.Attribute;
import org.ivoa.vodml.jaxb.Composition;
import org.ivoa.vodml.jaxb.ElementRef;
import org.ivoa.vodml.jaxb.ObjectType;
import org.ivoa.vodml.jaxb.Reference;


public class ObjectTypeNode extends StructuredTypeNode {

	private ArrayList<CompositionNode> collections;
	private ReferenceNode container;
	public ObjectTypeNode(ObjectType t, ModelGraph vodml) {
		super(t, vodml);
		collections = new ArrayList<CompositionNode>();
		addRoles();
	}

	public ObjectType getObjectType()
	{
		return (ObjectType)getElement();
	}
	@Override
	protected void addRoles()
	{
		super.addRoles();
		ObjectType t = getObjectType();
		for(Attribute a: t.getAttribute())
			addAttribute(a);
		for(Reference r: t.getReference())
			addReference(r);
		for(Composition c: t.getComposition())
			addComposition(c);
	}
	protected void addComposition(Composition a)
	{
		CompositionNode node = new CompositionNode(a, this, getModelGraph());
		collections.add(node);
		addRole(node);
	}
	protected void setContainer(ReferenceNode c)
	{
		if(container != null) throw new IllegalStateException("Cannot overwrite an existing container node");
		this.container = c;
		addRole(this.container);
	}

	public ReferenceNode getContainer() {
		return container;
	}

	protected Iterator<CompositionNode> getCollections() {
		return collections.iterator();
	}
	/**
	 * return utype for direct child element with specified name of this model.<br/>
	 * @param name
	 * @return
	 */
	@Override
	public String childForName(String name)
	{
		ObjectType ot = getObjectType();
		if(name == null)
			throw new IllegalArgumentException("Can not ask for element with name that is 'null'");
		for(Attribute e: ot.getAttribute())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(Reference e: ot.getReference())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(Composition e: ot.getComposition())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());

		return null;
	}

	@Override
	public void resolveRoles() {
		super.resolveRoles();
		
		/*
		for(CompositionNode c: this.collections){
			ObjectTypeNode targetNode = (ObjectTypeNode)c.getDatatype();
			targetNode.setContainer(c);
		}
		*/
	}


}
