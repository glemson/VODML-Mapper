package org.ivoa.vodml.model;

import java.io.Serializable;

public interface Identifier extends Serializable{

	/**
	 * Return an array of strings that should represent this identifier in a serialization.<br/>
	 * @return
	 */
	public String[] fields();
	
	public StringBuilder deepToString(StringBuilder sb, String offset);

}
