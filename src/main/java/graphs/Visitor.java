package graphs;

public interface Visitor<T> {

	public void visit(Node<T> node);
}
