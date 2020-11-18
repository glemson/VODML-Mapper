package org.ivoa.vodml.graph;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.DataType;
import org.ivoa.vodml.jaxb.Enumeration;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ObjectType;
import org.ivoa.vodml.jaxb.Package;
import org.ivoa.vodml.jaxb.PrimitiveType;
import org.ivoa.vodml.model.StructuredObject;


public class ModelNode extends ElementNode{

	private String url;
	private Model model;
	public ModelNode(Model _model, String _url, ModelGraph mg)
	{
		super(null, mg);
		this.model= _model;
		this.url = _url;
	}
	public void setModelGraph(ModelGraph mg)
	{
		setGraph(mg);
	}
	public Model getModel() {
		return model;
	}
	public String getUrl() {
		return url;
	}
	public StringBuilder deepToString(StringBuilder sb, String offset)
	{
		String newoffset = offset+"  ";
		sb.append(offset).append("<model>").append(StructuredObject.NEWLINE);
		sb.append(newoffset).append(String.format("<vodmlURL>%s</vodmlURL>",url)).append(StructuredObject.NEWLINE);
		sb.append(newoffset).append(String.format("<vodmlrefPrefix>%s</vodmlrefPrefix>",getModel().getName())).append(StructuredObject.NEWLINE);
		sb.append(offset).append("</model>");
		return sb;
	}
	/**
	 * return utype for direct child element with specified name of this model.<br/>
	 * @param name
	 * @return
	 */
	@Override
	public String childForName(String name)
	{
		Model model = getModel();
		if(name == null)
			throw new IllegalArgumentException("Can not ask for element with name that is 'null'");
		for(Package e : model.getPackage())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(PrimitiveType e: model.getPrimitiveType())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(Enumeration e: model.getEnumeration())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(DataType e: model.getDataType())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		for(ObjectType e: model.getObjectType())
			if(name.equals(e.getName())) 
				return VODMLREF.vodmlrefFor(e, getModel());
		return null;
	}

}
