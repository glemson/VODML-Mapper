package org.ivoa.vodml.graph;

import org.ivoa.vodml.jaxb.Composition;


public class ContainerNodeXXX extends RelationNode {

	public ContainerNodeXXX(Composition _e, ObjectTypeNode _parentType, ModelGraph _vodml) {
		super(_e, _parentType, _vodml);
	}
	
	public Composition getComposition() 
	{
		return (Composition)getElement();
	}
	public ObjectTypeNode getParentObjectType()
	{
		return (ObjectTypeNode)getOwner();
	}


}
