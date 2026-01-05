package org.ivoa.vodml.graph;

import org.ivoa.vodml.jaxb.EnumLiteral;

public class LiteralNode extends ElementNode {

	private EnumerationNode parentEnum;
	public LiteralNode(EnumLiteral _e, EnumerationNode _containerNode, ModelGraph _vodml) {
		super(_e, _vodml);
		this.parentEnum = _containerNode;
	}



}
