import fs from "fs";
import { Graph } from "./Graph";
import { DiseaseType } from "./Disease";
import { DeepReadonly } from "./Utils";

export type CityName = "atalanta" | "london";

export type ReadonlyCity = Omit<
  DeepReadonly<City>,
  "diseases" | "diseaseCubeCount"
> & {
  readonly diseases: ReadonlySet<DiseaseType>;
  readonly diseaseCubeCount: ReadonlyMap<DiseaseType, number>;
};

export type ReadonlyCityNetwork = {
  getCityByName(name: CityName): ReadonlyCity;
  getNeighbouringCities(city: City | CityName): readonly ReadonlyCity[];
  areCitiesNeighbours(
    city1: City | CityName | ReadonlyCity,
    city2: City | CityName | ReadonlyCity
  ): boolean;
  cities: readonly ReadonlyCity[];
  researchStations: readonly ReadonlyCity[];
  researchStationsPlaced: number;
};

interface CityFileData {
  readonly name: CityName;
  readonly neighbours: CityName[];
}

export class City {
  readonly diseases = new Set<DiseaseType>();
  readonly diseaseCubeCount = new Map<DiseaseType, number>([
    ["red", 0],
    ["yellow", 0],
    ["blue", 0],
    ["black", 0],
  ]);

  constructor(
    public readonly name: CityName,
    public hasResearchStation: boolean = false
  ) {}

  get isInfected(): boolean {
    return this.diseases.size > 0;
  }

  isInfectedWith(diseaseType: DiseaseType): boolean {
    return this.diseases.has(diseaseType);
  }
}

export class CityNetwork {
  private readonly graph = new Graph<City>();

  static buildFromFile(path: string): CityNetwork {
    const jsonData = fs.readFileSync(path, "utf-8");
    const data: CityFileData[] = JSON.parse(jsonData);
    const cityNetwork = new CityNetwork();

    for (const cityData of data) {
      const city = new City(cityData.name);
      cityNetwork.addCity(city);

      for (const neighbour of cityData.neighbours) {
        const neighbourCity = new City(neighbour);
        cityNetwork.addCity(neighbourCity);
        cityNetwork.addNeighbour(city, neighbourCity);
      }
    }

    return cityNetwork;
  }

  private addCity(city: City): void {
    if (!this.graph.hasVertex(city)) {
      this.graph.addVertex(city);
    }
  }

  private addNeighbour(city: City, neighbourCity: City): void {
    this.graph.addEdge(city, neighbourCity);
  }

  get researchStations(): readonly City[] {
    return this.graph.findVerticesWith("hasResearchStation", true);
  }

  get researchStationsPlaced(): number {
    return this.researchStations.length;
  }

  get cities(): readonly City[] {
    return this.graph.vertices;
  }

  areCitiesNeighbours(city1: City | CityName, city2: City | CityName): boolean {
    const tempCity1 =
      typeof city1 === "string" ? this.getCityByName(city1) : city1;
    const tempCity2 =
      typeof city2 === "string" ? this.getCityByName(city2) : city2;
    return this.graph.areNeighbours(tempCity1, tempCity2);
  }

  getCityByName(name: CityName): City {
    const city = this.graph.vertices.find((city) => city.name === name);
    if (city === undefined) {
      throw new Error("Could not find city. Error loading city config");
    }
    return city;
  }

  getNeighbouringCities(city: City | CityName): City[] {
    const tempCity = typeof city === "string" ? this.getCityByName(city) : city;
    return this.graph.getNeighbours(tempCity);
  }

  *[Symbol.iterator](): IterableIterator<City> {
    yield* this.graph.vertices;
  }
}
