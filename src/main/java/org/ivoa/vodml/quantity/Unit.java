package org.ivoa.vodml.quantity;

public class Unit {

	private String unit;
	public Unit(String v)
	{
		setUnit(v);
	}
	private void setUnit(String v)
	{
		if(isValidUnit(v))
			this.unit = v;
		else
			throw new IllegalArgumentException(String.format("'%s' is not a valid unit string",v));
	}
	public static boolean isValidUnit(String unit)
	{
		// TODO implement proper syntax checking
		return true;
	}
	public String toString()
	{
		return this.unit;
	}
}
