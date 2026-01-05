package org.ivoa.vodml.graph;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.Attribute;
import org.ivoa.vodml.jaxb.DataType;
import org.ivoa.vodml.jaxb.Reference;
import org.ivoa.vodml.jaxb.Role;



public abstract class RoleNode extends ElementNode{

//	private TypeNode datatype;
	private TypeNode owner; // owner of the role
	public RoleNode(Role _e, TypeNode _owner, ModelGraph _vodml) {
		super(_e, _vodml);
		this.owner = _owner;
	}
	public TypeNode getDatatype() {
		return getModelGraph().getType(this.getRole());
	}
	public Role getRole()
	{
		return (Role)getElement();
	}
	public TypeNode getOwner() {
		return owner;
	}

	public String childForName(String name)
	{
		return getDatatype().childForName(name);
	}

	public String getName()
	{
		return getRole().getName();
	}
}
