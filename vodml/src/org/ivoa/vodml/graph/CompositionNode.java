package org.ivoa.vodml.graph;

import org.ivoa.vodml.jaxb.Composition;


public class CompositionNode extends RelationNode {

	public CompositionNode(Composition _e, ObjectTypeNode _owner, ModelGraph _vodml) {
		super(_e, _owner, _vodml);
	}
	public Composition getComposition(){
		return (Composition)getElement();
	}
	public ObjectTypeNode getContainerType()
	{
		return (ObjectTypeNode)getOwner();
	}
	public ObjectTypeNode getParent(){
		return getContainerType();
	}
	public ObjectTypeNode getChild(){
		return getTargetObjectType();
	}

}