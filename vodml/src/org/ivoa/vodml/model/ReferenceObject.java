package org.ivoa.vodml.model;

public class ReferenceObject {

	/** The identifier of the referenced object */
	private ObjectID refID;
	private StructuredObject owner;
	/** the VODML annotation of the reference */
	private String vodmlref;
	/** the vodmlref of the target type of the reference */
	private String targetVodmlref;
	public ReferenceObject(String _utype, String _refUtype, ObjectID r)
	{
		this.vodmlref = _utype;
		this.targetVodmlref = _refUtype;
		this.refID = r;
	}
	public ReferenceObject(String _utype, String _refUtype, StringsIdentifier pID)
	{
		this(_utype, _refUtype, new ObjectID(false));
		this.refID.setPublisherDID(pID);
	}
	public ObjectID getRefID() {
		return refID;
	}
	public String getTargetVodmlref() {
		return targetVodmlref;
	}
	public StructuredObject getOwner() {
		return owner;
	}
	public void setOwner(StructuredObject owner) {
		this.owner = owner;
	}
}
