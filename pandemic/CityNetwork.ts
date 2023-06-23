import fs from "fs";

import { Graph } from "./Graph";
import { DiseaseType } from "./Disease";

interface CityFileData {
  readonly name: string;
  readonly neighbours: string[];
}

class City {
  diseaseType?: DiseaseType;
  diseaseCubeCount?: number;

  constructor(
    public readonly name: string,
    public infected: boolean = false,
    public researchStation: boolean = false
  ) {}
}

export class CityNetwork {
  private readonly graph: Graph<City>;

  private constructor() {
    this.graph = new Graph<City>();
  }

  getCityByName(name: string): City | undefined {
    return this.graph.vertices.find((city) => city.name === name);
  }

  getNeighbouringCities(city: City): City[] {
    return this.graph.getNeighbours(city);
  }

  areCitiesNeighbours(city1: City, city2: City): boolean {
    return this.graph.areNeighbours(city1, city2);
  }

  static buildFromFile(path: string): CityNetwork {
    const jsonData = fs.readFileSync(path, "utf-8");
    const data: CityFileData[] = JSON.parse(jsonData);

    const cityNetwork = new CityNetwork();

    for (const cityData of data) {
      const city = new City(cityData.name);
      cityNetwork.graph.addVertex(city);
      for (const neighbour of cityData.neighbours) {
        const neighbourCity = new City(neighbour);
        if (!cityNetwork.graph.hasVertex(neighbourCity)) {
          cityNetwork.graph.addVertex(neighbourCity);
        }
        cityNetwork.graph.addEdge(city, neighbourCity);
      }
    }
    return cityNetwork;
  }

  *[Symbol.iterator](): IterableIterator<City> {
    for (const city of this.graph) {
      yield city;
    }
  }
}

export type CityName = "atalanta" | "london";
