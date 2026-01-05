package org.ivoa.vodml.graph;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.jaxb.Type;

public abstract class TypeNode extends ElementNode{

	private Hashtable<String, RoleNode> roles;

	private ArrayList<TypeNode> subClasses;
	public TypeNode(Type _e, ModelGraph _vodml) {
		super(_e, _vodml);
		roles = new Hashtable<String, RoleNode>();
		subClasses = new ArrayList<TypeNode>();
	}
	
	public Type getType()
	{
		return (Type)getElement();
	}
	
	protected void addRole(RoleNode role)
	{
		roles.put(role.getVODMLREF(), role);
	}
	private void addSubClass(TypeNode sc)
	{
		this.subClasses.add(sc);
	}
	protected void addRoles()
	{
	}

	public void resolveRoles()
	{
	}
	public TypeNode getSuperType() {
		
		return getType().getExtends() == null?null:getVODML().findType(getType().getExtends().getVodmlRef());
	}

	public RoleNode getRole(String utype)
	{
		return roles.get(utype);
	}

	/**
	 * Check whether role is available on the current Type.<br/>
	 * True when defined on type, or on a base type.
	 * @param utype
	 * @return
	 */
	public boolean isRoleAvailable(String utype)
	{
		RoleNode role = getRole(utype);
		if(role != null)
			return true;
		else if(getSuperType() != null)
			return getSuperType().isRoleAvailable(utype);
		else if(this instanceof ObjectTypeNode)
			return VODMLREF.isObjectID(utype) || VODMLREF.isContainer(utype);
		else
			return false;
	}
	public boolean isRoleAvailable(RoleNode role)
	{
		return isRoleAvailable(role.getVODMLREF());
	}
	/**
	 * Return true if the current type is equal to or a subclass of the specified type.<br/>
	 * @param other
	 * @return
	 */
	public boolean isSubClassOrSelf(TypeNode other)
	{
		if(other == this)
			return true;
		else if(other == null)
			return false; // TODO TBD whether an illegalargumentexception should be thrown
		else if(getSuperType() == null)
			return false;
		else
			return getSuperType().isSubClassOrSelf(other);
	}
	/**
	 * Return true if the current type is equal to or a base class of the specified type.<br/>
	 * @param other
	 * @return
	 */
	public boolean isBaseClassOrSelf(TypeNode other)
	{
		if(other == null)
			return false; //TODO TBD whether an illegalargumentexception should be thrown
		return other.isSubClassOrSelf(this);
	}

	public Iterator<TypeNode> getSubClasses() {
		return subClasses.iterator();
	}


}
