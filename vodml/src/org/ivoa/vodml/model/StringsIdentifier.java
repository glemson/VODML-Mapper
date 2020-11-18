package org.ivoa.vodml.model;

import java.util.ArrayList;

public class StringsIdentifier extends ArrayList<String> implements Identifier{

	/**
	 * 
	 */
	private static final long serialVersionUID = 4469872561619320810L;

	public StringsIdentifier(String[] c) {
		for (String s : c)
			this.add(s);
	}

	public StringsIdentifier() {
	}

	public StringsIdentifier(String c) {
		this.add(c);
	}

	public StringsIdentifier(Object c) {
		this(c.toString());
	}

	/**
	 * Return an array of strings that should represent this identifier in a serialization.<br/>
	 * @return
	 */
	public String[] fields()
	{
		return this.toArray(new String[]{});
	}
	
	public StringBuilder deepToString(StringBuilder sb, String offset)
	{
		for(String f: fields())
			sb.append(offset).append("<field>").append(f).append("</field>").append(StructuredObject.NEWLINE);
		return sb;
	}
}
