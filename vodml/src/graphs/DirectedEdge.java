package graphs;

public class DirectedEdge<T, E> implements IEdge<T>{

	private Node<T> fromNode, toNode;
	// an edge can be given an object representing extra information about it
	private E edgeType;
	public DirectedEdge(Node<T> f, Node<T> t, E _edgeType)
	{
		if(f == null || t == null)
			throw new IllegalArgumentException("When creating a DirectedEdge, both nodes must be NOT NULL");
		this.fromNode = f;
		this.toNode = t;
		this.edgeType = _edgeType;
	}
	public Node<T> getFrom() {
		return fromNode;
	}

	public Node<T> getTo() {
		return toNode;
	}

	public String toString()
	{
		return String.format("DirectedEdge from %s => %s", fromNode.toString(), toNode.toString());
	}
	public E getEdgeType() {
		return edgeType;
	}
}
