package org.ivoa.vodml.model;

public abstract class ModelFactory {
    public StructuredObject newStructuredObject(String utype)
    {
    	return null;
    }
    public Object newEnumeratedValue(String utype, String value)
    {
    	return null;
    }
    public Object newPrimitiveValue(String utype, String value)
    {
    	return null;
    }

}
