package org.ivoa.vodml.graph;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.Attribute;
import org.ivoa.vodml.jaxb.DataType;
import org.ivoa.vodml.jaxb.Reference;


public class DataTypeNode extends StructuredTypeNode {

	public DataTypeNode(DataType t, ModelGraph vodml) {
		super(t, vodml);
		// TODO Auto-generated constructor stub
		addRoles();
	}

	public DataType getDataType()
	{
		return (DataType)getElement();
	}

	@Override
	protected void addRoles()
	{
		super.addRoles();
		DataType t = getDataType();
		for(Attribute a: t.getAttribute())
			addAttribute(a);
		for(Reference r: t.getReference())
			addReference(r);
	}

	public String childForName(String name)
	{
		DataType ot = getDataType();
		if(name == null)
			throw new IllegalArgumentException("Can not ask for element with name that is 'null'");
		for(Attribute e: ot.getAttribute())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(Reference e: ot.getReference())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		return null;
	}

	public DataTypeNode getBaseType()
	{
		return getDataType().getExtends() == null?null:((DataTypeNode)getVODML().findType(getDataType().getExtends().getVodmlRef()));

	}
}
