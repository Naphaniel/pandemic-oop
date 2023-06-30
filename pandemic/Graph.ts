import fs from "fs";

interface GraphData<T> {
  readonly vertices: T[];
  readonly edges: { from: T; to: T }[];
}

export class Graph<T> {
  private readonly adjacencyList = new Map<T, T[]>();

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

  get vertices(): T[] {
    return [...this.adjacencyList.keys()];
  }

  addVertex(...vertices: T[]): void {
    for (const vertex of vertices) {
      if (!this.adjacencyList.has(vertex)) {
        this.adjacencyList.set(vertex, []);
      }
    }
  }

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

  findVerticesWith<K extends keyof T>(key: K, value: T[K]): T[] {
    return this.vertices.filter((vertex) => vertex[key] === value);
  }

  areNeighbours(vertex1: T, vertex2: T): boolean {
    const neighbours = this.getNeighbours(vertex1);
    return neighbours !== undefined && neighbours.includes(vertex2);
  }

  getNeighbours(vertex: T): T[] {
    return this.adjacencyList.get(vertex) || [];
  }

  hasVertex(vertex: T): boolean {
    return this.adjacencyList.has(vertex);
  }

  toString(): string {
    let result = "";
    for (const [vertex, neighbours] of this.adjacencyList.entries()) {
      result += `${vertex} ---> ${neighbours.join(", ")}\n`;
    }
    return result;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.adjacencyList.keys();
  }
}
