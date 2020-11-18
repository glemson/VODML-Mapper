package org.ivoa.vodml;


import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ReferableElement;

public class VODMLREF {

	private final static String MODEL = "vodml-map:Model";
	private final static String MODEL_URL = "vodml-map:Model.url";
	private final static String MODEL_PREFIX = "vodml-map:Model.name";
	private final static String OBJECTTYPE = "vodml-map:ObjectTypeInstance";
	private final static String OBJECT_ID = "vodml-map:ObjectTypeInstance.ID";
	private final static String IDENTIFIER = "vodml-map:Identifier";
	private final static String REFERENCE = "vodml-map:Reference";
	private final static String GROUPref = "vodml-map:GROUPref";
	private final static String ORMREFERENCE = "vodml-map:ORMReference";
	private final static String REMOTEREFERENCE = "vodml-map:RemoteReference";
	private final static String INSTANCE_TYPE = "vodml-map:Instance.type";
	private final static String TYPE_INSTANCE = "vodml-map:Type.instance";
	private final static String OBJECTTYPE_INSTANCE = "vodml-map:ObjectType.instance";
	private final static String DATATYPE_INSTANCE = "vodml-map:DataType.instance";
	private final static String CONTAINER = "vodml-map:ObjectTypeInstance.container";
	private final static String COLLECTION_ITEM = "vodml-map:Collection.item";

	public static boolean isReference(String vodmlref)
	{
		return REFERENCE.equals(vodmlref)
				|| GROUPref.equals(vodmlref)
				|| ORMREFERENCE.equals(vodmlref)
				|| REMOTEREFERENCE.equals(vodmlref);
	}
	public static boolean isTypeInstance(String vodmlref)
	{
		return TYPE_INSTANCE.equals(vodmlref);
	}
	public static boolean isObjectTypeInstance(String vodmlref)
	{
		return OBJECTTYPE_INSTANCE.equals(vodmlref);
	}
	public static boolean isDataTypeInstance(String vodmlref)
	{
		return DATATYPE_INSTANCE.equals(vodmlref);
	}
	public static boolean isContainer(String vodmlref)
	{
		return CONTAINER.equals(vodmlref);
	}
	
	
	public static boolean isObjectID(String vodmlref)
	{
		return OBJECT_ID.equals(vodmlref);
	}

	/**
	 * utility method to extract the utype from a ReferencableElement.<br/>
	 * If this is used, only this method needs to be changed if the
	 * identifier/utype design were to be changed.
	 * 
	 * @param el
	 * @return
	 */
	public static final String vodmlrefFor(ReferableElement el, Model model) {
		return (el == null?null:model.getName()+":"+el.getVodmlId());
	}

	public static String getPrefix(String vodmlref)
	{
		if(vodmlref == null)
			return null;
		int ix = vodmlref.indexOf(':');
		if (ix < 0)
			return vodmlref;
		return vodmlref.substring(0, ix);
		
	}
}
