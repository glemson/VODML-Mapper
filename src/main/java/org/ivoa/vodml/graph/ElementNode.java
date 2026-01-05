package org.ivoa.vodml.graph;

import org.ivoa.vodml.VODMLREF;
import org.ivoa.vodml.VODMLManager;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ReferableElement;


public abstract class ElementNode {
	private ModelGraph modelGraph;
	private ReferableElement element;
	
	public ElementNode(ReferableElement _e, ModelGraph mg)
	{
		this.element = _e;
		setGraph(mg);
	}
	protected void setGraph(ModelGraph mg)
	{
		this.modelGraph = mg;
		if(mg != null)
			this.modelGraph.register(this);
	}
	public String getVODMLREF() {
		return VODMLREF.vodmlrefFor(element, modelGraph.getModel());
	}
	public ReferableElement getElement() {
		return element;
	}
	protected ModelGraph getModelGraph() {
		return modelGraph;
	}
	public Model getModel()
	{
		return getModelGraph().getModel();
	}
	public VODMLManager getVODML()
	{
		return this.modelGraph.getVodml();
	}
	@Override
	public int hashCode() {
		return getVODMLREF().hashCode();
	}
	@Override
	public String toString() {
		return getVODMLREF();
	}
	/**
	 * Return utype of direct child element with the given name and which is available on current element.<br/>
	 * Must be overridden on subclasses with children.
	 * @param name
	 * @return
	 */
	public String childForName(String name)
	{
		return null;
	}
}
