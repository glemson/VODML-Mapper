package org.ivoa.vodml.model;

public class ObjectID  {

	// identifier explicitly declared by a serialiser
	private StringsIdentifier publisherDID = null;
	// alternative id that can be assigned to an object based on a serialization format
	// e.g. based on ID attribute of a GROUP that directly represents an object.
	private Identifier altID = null;
	// unique negative number assigned to each objecttypeinstance.
	private Long transientID = null;

	private static int currentID = -1;
	private static synchronized long newID()
	{
		return currentID--;
	}
	public ObjectID()
	{
		this(true);
	}
	public ObjectID(boolean hasTransient)
	{
		if(hasTransient)
			transientID = newID();
	}
	public StringBuilder deepToString(StringBuilder sb, String offset)
	{
		String newoffset=offset+"  ";
		sb.append(offset).append("<identifier>").append(StructuredObject.NEWLINE);
		if(transientID != null) // otherwise not assigned
			sb.append(newoffset).append("<transientID>").append(transientID).append("</transientID>").append(StructuredObject.NEWLINE);
		if(publisherDID != null)
		{
			sb.append(newoffset).append("<publisherDID>");
			publisherDID.deepToString(sb, newoffset+"  ");
			sb.append("</publisherDID>").append(StructuredObject.NEWLINE);
		}
		if(altID != null)
		{
			sb.append(newoffset).append("<altID>").append(StructuredObject.NEWLINE);
			altID.deepToString(sb, newoffset+"  ").append(StructuredObject.NEWLINE);
			sb.append(newoffset).append("</altID>").append(StructuredObject.NEWLINE);
		}
		sb.append(offset).append("</identifier>").append(StructuredObject.NEWLINE);
		return sb;
	}
	public StringsIdentifier getPublisherDID() {
		return publisherDID;
	}
	public void setPublisherDID(StringsIdentifier publisherDID) {
		this.publisherDID = publisherDID;
	}
	public Identifier getExternalID() {
		return altID;
	}
	public void setExternalID(Identifier externalID) {
		this.altID = externalID;
	}
	public Identifier getAltID() {
		return altID;
	}
	public void setAltID(Identifier altID) {
		this.altID = altID;
	}
	public Long getTransientID() {
		return transientID;
	}
}
