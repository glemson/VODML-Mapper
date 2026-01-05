package org.ivoa.vodml.graph;
import org.ivoa.vodml.jaxb.Role;

public class RelationNode extends RoleNode {

	public RelationNode(Role _e, TypeNode _owner, ModelGraph _vodml) {
		super(_e, _owner, _vodml);
	}

	public ObjectTypeNode getTargetObjectType() {
		return (ObjectTypeNode)getDatatype();
	}

}
