package org.ivoa.vodml;


import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ReferableElement;

public class Utype {

	public final static String MODEL = "vodml-map:Model";
	public final static String MODEL_URL = "vodml-map:Model.url";
	public final static String MODEL_PREFIX = "vodml-map:Model.name";
	public final static String OBJECTTYPE = "vodml-map:ObjectType";
	public final static String OBJECT_ID = "vodml-map:Object.ID";
	public final static String IDENTIFIER = "vodml-map:Identifier";
	public final static String REFERENCE = "vodml-map:Reference";
	public final static String INSTANCE_TYPE = "vodml-map:Instance.type";
	public final static String TYPE_INSTANCE = "vodml-map:Type.instance";
	public final static String OBJECTTYPE_INSTANCE = "vodml-map:ObjectType.instance";
	public final static String DATATYPE_INSTANCE = "vodml-map:DataType.instance";
	public final static String CONTAINER = "vodml-map:Object.container";
	public final static String COLLECTION_ITEM = "vodml-map:Collection.item";


	public static boolean isModel(String utype) {
		return MODEL.equals(utype);
	}

	/**
	 * utility method to extract the utype from a ReferencableElement.<br/>
	 * If this is used, only this method needs to be changed if the
	 * identifier/utype design were to be changed.
	 * 
	 * @param el
	 * @return
	 */
	public static final String utypeFor(ReferableElement el, Model model) {
		return (el == null?null:model.getName()+":"+el.getVodmlId());
	}

	public static String getPrefix(String utype)
	{
		if(utype == null)
			return null;
		int ix = utype.indexOf(':');
		if (ix < 0)
			return utype;
		return utype.substring(0, ix);
		
	}
}
