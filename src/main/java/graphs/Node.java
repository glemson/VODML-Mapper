package graphs;

import java.util.ArrayList;
import java.util.Iterator;
public class Node<T> {

	private String id;
	private T object;
	private Status status = Status.notvisited;
	private ArrayList<IEdge<T>> incomingEdges;
	private ArrayList<IEdge<T>> outgoingEdges;
	
	public Node(String _id, T object)
	{
		this.id = _id;
		this.object = object;
	}
	
	public Iterator<IEdge<T>> getOutgoinEdges(){
		return outgoingEdges.iterator();
	}
	private ArrayList<IEdge<T>> incomingEdges()
	{
		if(incomingEdges == null)
			incomingEdges = new ArrayList<IEdge<T>>();
		return incomingEdges;
	}
	private ArrayList<IEdge<T>> outgoingEdges()
	{
		if(outgoingEdges == null)
			outgoingEdges = new ArrayList<IEdge<T>>();
		return outgoingEdges;
	}

	public Iterator<IEdge<T>> getIncomingEdges()
	{
		return incomingEdges.iterator();
	}
			
	public void prepareForTraversal()
	{
		status = Status.notvisited;
	}
	public String getId() {
		return id;
	}
	
	public boolean addIncoming(IEdge<T> e)
	{
		if(e.getTo() != this)
			throw new IllegalArgumentException("Can only add incoming edge to the to-node");
		return incomingEdges().add(e);
	}
	public boolean addOutgoing(IEdge<T> e)
	{
		if(e.getFrom() != this)
			throw new IllegalArgumentException("Can only add outgoing edge to the from-node");
		return outgoingEdges().add(e);
	}

	public T getObject() {
		return object;
	}
	
	public void visit(Visitor<T> visitor, boolean forward)
	{
		if(status == Status.notvisited)
		{
			status = Status.visited;
			ArrayList<IEdge<T>> edges = forward?outgoingEdges():incomingEdges();
			for(IEdge<T> edge : edges)
				edge.getTo().visit(visitor, forward);
			visitor.visit(this);
			status = Status.processed;
		}
	}
	public String toString()
	{
		return String.format("Node [%s]",getObject().toString());
	}
}
