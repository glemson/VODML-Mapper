package org.ivoa.vodml.model;

import org.ivoa.vodml.jaxb.ObjectType;

public abstract class ObjectTypeInstance extends StructuredObject {

	public static final String CONTAINER_UTYPE = "vodml-map:ObjectTypeInstance.container";
	public static final String OBJECTTYPE_ID_UTYPE = "vodml-map:ObjectTypeInstance.ID";

	private ObjectTypeInstance _container;
	private ReferenceObject _ref_container;

	public ObjectTypeInstance() {
		this._ID = new ObjectID();
	}

	private ObjectID _ID;

	public ObjectID get_ID() {
		return _ID;
	}

	public StringsIdentifier get_publisherDID() {
		return this._ID.getPublisherDID();
	}

	public StringsIdentifier getContainerPublisherDID() {
		if(_container == null)
			return (_ref_container == null?null:_ref_container.getRefID().getPublisherDID());
		else 
			return _container.get_publisherDID(); 
	}

	public Identifier get_altID() {
		return this._ID.getAltID();
	}
	public Long getTransientID()
	{
		return this._ID.getTransientID();
	}

	public void set_publisherDID(StringsIdentifier pID) {
		this._ID.setPublisherDID(pID);
	}

	public void set_altID(Identifier pID) {
		this._ID.setAltID(pID);
	}

	@Override
	public final void deepToString(StringBuilder sb, String offset) {
		sb.append(offset).append(String.format("<object vodmlRef=\"%s\">", vodmlRef())).append(
				NEWLINE);
		String newoffset=offset+"  ";
		attributesToString(sb, newoffset);
		referencesToString(sb, newoffset);
		containerToString(sb, newoffset);
		compositionsToString(sb, newoffset);
		sb.append(offset).append("</object>").append(NEWLINE);
	}

	public void attributesToString(StringBuilder sb, String offset) {
		_ID.deepToString(sb, offset);
	}

	public void compositionsToString(StringBuilder sb, String offset) {
		return;
	}

	public void containerToString(StringBuilder sb, String offset) {
		return;
	}

	@Override
	public Object getProperty(String utype) {
		if (OBJECTTYPE_ID_UTYPE.equals(utype))
			return get_ID();
		return null;
	}

	public boolean add2composition(final String utype, ObjectTypeInstance object) 
	{
		return false;
	}
	public boolean setProperty(final String utype, String pValue) {
		if (OBJECTTYPE_ID_UTYPE.equals(utype)) {
			_ID.setPublisherDID(new StringsIdentifier(pValue));
			return true;
		} 
				
		return false;
	}

	public boolean setProperty(final String utype, Object pValue) {
		if (OBJECTTYPE_ID_UTYPE.equals(utype) && pValue instanceof Identifier) {
			_ID.setPublisherDID((StringsIdentifier) pValue);
			return true;
		}
		if (CONTAINER_UTYPE.equals(utype)) {
			if(pValue instanceof ReferenceObject)
				_ref_container = (ReferenceObject)pValue; 
			else if(pValue instanceof ObjectTypeInstance)
				_container = (ObjectTypeInstance)pValue;
			else
				return false;
			return true;
		} 
		return false;
	}

	//
	/**
	 * Sets the Container Entity == 'Parent' ONLY
	 * 
	 * @param pContainer
	 *            the parent container
	 */
	public void setContainerField(final ObjectTypeInstance pContainer) {
		if (this._container == null) {
			this._container = pContainer;
			if (pContainer != null)
				this._ref_container = null;
		}
	}
    /** 
     * Sets the Container Entity == 'Parent' ONLY
     * @param pContainer lazy reference to the parent container
     */
    protected void setContainerField(final ReferenceObject pContainer) {
      if(this._container==null)
      {
        this._ref_container = pContainer;
        pContainer.setOwner(this);
      }
    }


	/** 
	 * TODO add consistency test 
	 */
	public void setContainer(ObjectTypeInstance o) {
		this._container = o;
	}

	public ObjectTypeInstance getContainer() {
		return _container;
	}
	protected ObjectTypeInstance getContainerField() {
		return _container;
	}

	public ReferenceObject get_ref_container() {
		return _ref_container;
	}
    @Override
    public String vodmlRef()
    {
    	return "vodml-map:ObjectType";
    }
    @Override
    public String vodmlId()
    {
    	return "ObjectType";
    }
}
