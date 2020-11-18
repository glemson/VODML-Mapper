package org.ivoa.vodml.graph;

import org.ivoa.vodml.jaxb.Attribute;
import org.ivoa.vodml.jaxb.Role;


public class AttributeNode extends RoleNode {

	public AttributeNode(Attribute _e, TypeNode _owner, ModelGraph _vodml) {
		super(_e, _owner, _vodml);
	}
	public Attribute getAttribute()
	{
		return (Attribute)getElement();
	}

}
