package org.ivoa.vodml.model;

public abstract class StructuredObject {
	public static final String NEWLINE = "\n";
	public abstract String vodmlRef();
    public abstract String vodmlId();
    public Object getProperty(final String vodmlId) {
    	return null;
    }
    public boolean setProperty(final String vodmlId, Object pValue) {
    	return false;
    }
    public boolean setProperty(final String vodmlId, String pValue) {
    	return false;
    }

    public String toString()
    {
    	StringBuilder sb = new StringBuilder();
    	deepToString(sb,"");
    	return sb.toString();
    }
    public abstract void deepToString(StringBuilder sb, String offset);
    public void attributesToString(StringBuilder sb, String offset){
    	return;
    }
    public void referencesToString(StringBuilder sb, String offset){
    	return;
    }
    
	public void atomicToString(String utype, Object value, StringBuilder sb, String offset)
	{
		sb.append(offset).append(String.format("<primitiveValue vodmlRef=\"%s\">%s</primitiveValue>", utype,value.toString()));
	}
}
