package graphs;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
/** Graph of nodes representing T, edges representing E */
public class DirectedGraph<T, E> {

	public class Sorter<T> implements Visitor<T>
	{
		private ArrayList<Node<T>> sortedNodes = new ArrayList<Node<T>>();

		@Override
		public void visit(Node<T> node) {
			sortedNodes.add(node);
		}
	}
	
	public class CycleDetector<T> implements Visitor<T>
	{
		private ArrayList<Node<T>> sortedNodes = new ArrayList<Node<T>>();
		private ArrayList<Node<T>> cycleRoots;

		@Override
		public void visit(Node<T> node) {
			sortedNodes.add(node);
		}
	}
	
	
	private ArrayList<Node<T>> nodes;
	private Hashtable<String, Node<T>> nodesById;
	private ArrayList<DirectedEdge<T,E>> edges;
	
	public DirectedGraph()
	{
		this.nodes = new ArrayList<Node<T>>();
		this.nodesById = new Hashtable<String, Node<T>>();
		this.edges = new ArrayList<DirectedEdge<T, E>>();
	}
	
	public Node<T> getNode(String id)
	{
		return nodesById.get(id);
	}
	public boolean addNode(Node<T> node)
	{
		Node<T> other = getNode(node.getId());
		if(other == null)
		{
			nodes.add(node);
			nodesById.put(node.getId(), node);
			return true;
		} else
			return false;
	}
	public boolean addEdge(String fromId, String toId, E edgeType)
	{
		Node<T> fn = getNode(fromId);
		Node<T> tn = getNode(toId);
		return addEdge(fn, tn, edgeType);
	}
	public boolean addEdge(Node<T> fn, Node<T> tn, E edgeType)
	{
		if(fn == null || tn == null)
			return false;

		DirectedEdge<T,E> e = new DirectedEdge<T,E>(fn, tn, edgeType);
		// Graph decides whether it want the nodes to have incoming/outgoing edges, hence not set by edge's constructor
		fn.addOutgoing(e);
		tn.addIncoming(e);
		return edges.add(e);
	}
	public boolean addEdge(Node<T> fn, String toId, E edgeType)
	{
		Node<T> tn = getNode(toId);
		return addEdge(fn, tn, edgeType);
	}
	public boolean addEdge(String fromId, Node<T> tn, E edgeType)
	{
		Node<T> fn = getNode(fromId);
		return addEdge(fn, tn, edgeType);
	}
	
	private void prepareForTraversal(List<Node<T>> nodeList)
	{
		for(Node<T> node:nodeList)
			node.prepareForTraversal();
	}
	/** 
	 * Check whether graph has cycles.<br/>
	 * @return
	 */
	public boolean hasCycles()
	{
		return false;
	}
	public void sort()
	{ 
		Sorter<T> sorter = new Sorter<T>();
		traverse(sorter,true);
		this.nodes = sorter.sortedNodes;
	}
	


	/**
	 * 
	 * @param visitor
	 * @param forward if true follow edges in their forward direction, if false in the reverse direction
	 */
	private void traverse(Visitor<T> visitor, boolean forward)
	{
		traverse(nodes,visitor,forward);
	}
	
	private void traverse(List<Node<T>> nodeList, Visitor<T> visitor, boolean forward)
	{
		prepareForTraversal(nodeList);
		for(Node<T> node: nodeList)
			node.visit(visitor, forward);
	}

	public ArrayList<Node<T>> getNodes() {
		return nodes;
	}
}
