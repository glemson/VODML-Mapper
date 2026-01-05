package org.ivoa.vodml.model;

public abstract class DataTypeInstance  extends StructuredObject {
	@Override
    public final void deepToString(StringBuilder sb, String offset)
    {
			String newoffset=offset+"  ";
    	sb.append(offset).append(String.format("<dataObject vodmlRef=\"%s\">",vodmlRef())).append(NEWLINE);
    	attributesToString(sb, newoffset);
    	referencesToString(sb, newoffset);
    	sb.append(offset).append("</dataObject>").append(NEWLINE);
    }
}
