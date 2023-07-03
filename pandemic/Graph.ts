import fs from "fs";

/**
 * Internal interface that represents the structure of the JSON data used
 * to build the stack from a file in {@link Graph.fromJSONFile}
 *
 * @typeParam `T` - The type of data stored within the graph.
 */
interface GraphData<T> {
  readonly vertices: T[];
  readonly edges: { from: T; to: T }[];
}

/**
 * Represents a generic bi-directional, non weighted graph data structure.
 *
 * @typeParam `T` - The type of data stored within the graph.
 *
 * @remarks
 * This generic data structure illustrates **parametric polymorphism** through
 * generic types. The behaviour of this bi-directional, non weighted graph
 * is the same regardless of the data type it is storing.
 *
 * This graph is implemented using an adjacency list.
 *
 * Bi-directional, non weighted graph operations time complexity:
 *    - Storage O(V+E) where V = vertices and E = edges
 *    - Add vertex O(1)
 *    - Add edge O(1)
 *    - Remove vertex O(V+E)
 *    - Remove edge O(E)
 *    - Query O(V)
 */
export class Graph<T> {
  /**
   * Private mutable map which stores the vertices (keys) against an array
   * of their neighbouring vertices (values), effectively the edges of the
   * {@link Graph}.
   *
   * @remarks
   * We opted to use an adjaceny list over a adjacency matrix as the storage
   * requirement is less and we did not need the benefit of adding and removing
   * adges in constant time. For our use case, the difference between the two
   * is neglibile.
   *
   * This adjacency list is private so the internal data of the {@link Graph} is
   * encapsulated. Access is granted through getters and methods.
   */
  private readonly adjacencyList = new Map<T, T[]>();

  /**
   * Builds a new {@link Graph} of items from the given JSON file.
   *
   * @typeParam `T` - The type of data stored within the {@link Graph}.
   * @param path - File path to the data file.
   *
   * @remarks
   * This static method allows us to construct a {@link Graph} with either a data
   * file or an empty {@link Graph} from the constructor. Seeding from a file
   * can automate a lot of setup.
   *
   * {@link GraphData} - this interface defines the shape of the data
   * the JSON parser manipulates the data into.
   */
  static fromJSONFile<T>(path: string): Graph<T> {
    const jsonData = fs.readFileSync(path, "utf-8");
    const data: GraphData<T> = JSON.parse(jsonData);
    const graph = new Graph<T>();
    graph.addVertex(...data.vertices);
    for (const edge of data.edges) {
      graph.addEdge(edge.from, edge.to);
    }
    return graph;
  }

  /**
   * Gets all of the vertices in the graph.
   *
   * @returns An array containing all of the vertices in the graph.
   *
   * @remarks
   * A getter is used to avoid public access of the internal data storage
   * of the graph. The value is also computed so a getter is suitable.
   */
  get vertices(): T[] {
    return [...this.adjacencyList.keys()];
  }

  // ---- LOGIC ----

  /**
   * Add a single or multiple vertices to the {@link Graph} if the vertix does not
   * already exist.
   *
   * @param vertices - A variadic parameter allowing a comma seperated list
   * of arguments containing the vertices to add.
   *
   * @remarks
   * We use the spread operator `...` to allow for multiple vertices to be
   * passed in (i.e `vertex1, vertex2, vertex3`) this allows us to have
   * one function implementation of multiple inputs
   */
  addVertex(...vertices: T[]): void {
    for (const vertex of vertices) {
      if (!this.adjacencyList.has(vertex)) {
        this.adjacencyList.set(vertex, []);
      }
    }
  }

  /**
   * Remove a single or multiple vertices from the {@link Graph}.
   *
   * @param vertices - A variadic parameter allowing a comma sperated list of
   * arguments containing the vertices to add.
   *
   * @remarks
   * We use the spread operator `...` to allow for multiple vertices to be
   * passed in (i.e `vertex1, vertex2, vertex3`) this allows us to have
   * one function implementation of multiple inputs
   */
  removeVertex(...vertices: T[]): void {
    for (const vertex of vertices) {
      const neighbours = this.getNeighbours(vertex);
      for (const neighbour of neighbours) {
        const neighbourNeighbours = this.getNeighbours(neighbour);
        if (neighbourNeighbours) {
          this.adjacencyList.set(
            neighbour,
            neighbourNeighbours.filter((v) => v !== vertex)
          );
        }
      }
      this.adjacencyList.delete(vertex);
    }
  }

  /**
   * Add an bi-directional connection (edge) between two vertices. If the
   * vertices exist.
   *
   * @param vertex1 - One vertex to add an edge between.
   * @param vertex2 - Second vertex to add an edge between.
   */
  addEdge(vertex1: T, vertex2: T): void {
    if (this.adjacencyList.has(vertex1) && this.adjacencyList.has(vertex2)) {
      const neighbours1 = this.getNeighbours(vertex1);
      const neighbours2 = this.getNeighbours(vertex2);
      if (!neighbours1.includes(vertex2)) {
        neighbours1.push(vertex2);
      }
      if (!neighbours2.includes(vertex1)) {
        neighbours2.push(vertex1);
      }
    }
  }

  /**
   * Remove the bi-directional connection (edge) between two vertices.
   *
   * @param vertex1 - One vertex to remove an edge between.
   * @param vertex2 - Second vertex to remove an edge between.
   */
  removeEdge(vertex1: T, vertex2: T): void {
    const neighbours1 = this.getNeighbours(vertex1);
    const neighbours2 = this.getNeighbours(vertex2);
    if (neighbours1.length >= 1) {
      this.adjacencyList.set(
        vertex1,
        neighbours1.filter((v) => v !== vertex2)
      );
    }
    if (neighbours2.length >= 1) {
      this.adjacencyList.set(
        vertex2,
        neighbours2.filter((v) => v !== vertex1)
      );
    }
  }

  /**
   * A query that finds vertices in the {@link Graph} whose value satisifes a
   * given condition.
   *
   * @typeParam `K` - A key that exists within the object the {@link Graph} is storing.
   * @param key - The key of the property in the vertex to check.
   * @param value - The value that the key should match.
   * @returns An array containing matching vertices.
   *
   * @remarks
   * We use the generic type `K extends keyof T` to tell TypeScript that
   * the value of `key` must be a key within the object we are storing
   * of type `T`. This gives much stronger static type checking.
   */
  findVerticesWith<K extends keyof T>(key: K, value: T[K]): T[] {
    return this.vertices.filter((vertex) => vertex[key] === value);
  }

  /**
   * Checks whether two vertices are neighbours.
   *
   * @param vertex1 - One vertex of the pair to check.
   * @param vertex2 - Second vertex of the pair to check.
   * @returns `true` if the two vertices are neighbours, `false` otherwise.
   */
  areNeighbours(vertex1: T, vertex2: T): boolean {
    const neighbours = this.getNeighbours(vertex1);
    return neighbours !== undefined && neighbours.includes(vertex2);
  }

  /**
   * Gets the neighbours of a vertex.
   *
   * @param vertex - The vertex to get the neighbours of.
   * @returns An array of the neighbours of the given vertex. This will boolean
   * any empty array if there are none.
   */
  getNeighbours(vertex: T): T[] {
    return this.adjacencyList.get(vertex) || [];
  }

  /**
   * Checks whether the {@link Graph} has a given vertex.
   *
   * @param vertex - The vertex to check existance in the {@link Graph}.
   * @returns `true` if the vertex is in the {@link Graph}, `false` otherwise.
   */
  hasVertex(vertex: T): boolean {
    return this.adjacencyList.has(vertex);
  }

  // ---- UTILS ----

  /**
   * Returns the string representation of the {@link Graph}.
   *
   * @returns the string representation of the {@link Graph}.
   */
  toString(): string {
    let result = "";
    for (const [vertex, neighbours] of this.adjacencyList.entries()) {
      result += `${vertex} ---> ${neighbours.join(", ")}\n`;
    }
    return result;
  }

  /**
   * Returns an iterator for all the items in the {@link Graph}, which enables iteration
   * using a `for...of` loop.
   *
   * @remarks
   * This enables consumers to iterate over the {@link Graph} without being concerned
   * about the underlying implementation f.e if we changedto using a adjacency matrix
   */
  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.adjacencyList.keys();
  }
}
