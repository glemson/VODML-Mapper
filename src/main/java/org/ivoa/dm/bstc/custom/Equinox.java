package org.ivoa.dm.bstc.custom;

public class Equinox {

	private String value;
	public Equinox(String v)
	{
		if (isValid(v))
			this.value = v;
		else
			throw new IllegalArgumentException();
	}
	/**
	 * TODO implement validation method
	 * @param v
	 * @return
	 */
	public static boolean isValid(String v)
	{
		return true;
	}
	public String value()
	{
		return this.value;
	}
	public String toString()
	{
		return value;
	}
	
}
