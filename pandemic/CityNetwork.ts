import fs from "fs";

import { Graph } from "./Graph";
import { DiseaseType } from "./Disease";

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface CityFileData {
  readonly name: CityName;
  readonly neighbours: CityName[];
}

export class City {
  readonly diseaseType?: DiseaseType;
  readonly diseaseCubeCount: number = 0;

  constructor(
    public readonly name: CityName,
    public readonly infected: boolean = false,
    public readonly researchStation: boolean = false
  ) {}
}

export type CityName = "atalanta" | "london";

export class CityNetwork {
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

  private readonly graph = new Graph<City>();

  private getMutableCityByName(name: CityName): Mutable<City> {
    const city = this.graph.vertices.find((city) => city.name === name);
    if (city === undefined) {
      throw new Error("Could not find city. Error loading city config");
    }
    return city;
  }

  areCitiesNeighbours(city1: City, city2: City): boolean {
    return this.graph.areNeighbours(city1, city2);
  }

  getCityByName(name: CityName): City {
    {
      const city = this.graph.vertices.find((city) => city.name === name);
      if (city === undefined) {
        throw new Error("Could not find city. Error loading city config");
      }
      return city;
    }
  }

  getNeighbouringCities(city: City): City[] {
    return this.graph.getNeighbours(city);
  }

  infectCity(name: CityName, diseaseType: DiseaseType, count = 1) {
    const city = this.getMutableCityByName(name);
    city.diseaseType = diseaseType;
    city.infected = true;
    city.diseaseCubeCount += count;
  }

  *[Symbol.iterator](): IterableIterator<City> {
    for (const city of this.graph) {
      yield city;
    }
  }
}
