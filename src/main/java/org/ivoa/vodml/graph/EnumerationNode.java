package org.ivoa.vodml.graph;

import java.util.ArrayList;

import org.ivoa.vodml.jaxb.EnumLiteral;
import org.ivoa.vodml.jaxb.Enumeration;

public class EnumerationNode extends TypeNode {

	public ArrayList<LiteralNode> literals;
	public EnumerationNode(Enumeration _e, ModelGraph _vodml) {
		super(_e, _vodml);
		this.literals = new ArrayList<LiteralNode>();
		addLiterals();
	}
	public Enumeration getEnum()
	{
		return (Enumeration)getElement();
	}
	private void addLiterals()
	{
		for(EnumLiteral el: getEnum().getLiteral())
		{
			literals.add(new LiteralNode(el, this, getModelGraph()));
		}
	}

}
