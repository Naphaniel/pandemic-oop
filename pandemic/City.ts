import fs from "fs";
import { Graph } from "./Graph";
import { DiseaseType } from "./Disease";

interface CityFileData {
  readonly name: CityName;
  readonly neighbours: CityName[];
}

export type StateOnlyCity = Readonly<
  Omit<
    City,
    | "buildResearchStation"
    | "removeResearchStation"
    | "diseases"
    | "diseaseCubeCount"
  >
> & {
  readonly diseases: ReadonlySet<DiseaseType>;
  readonly diseaseCubeCount: ReadonlyMap<DiseaseType, number>;
};

export class City {
  readonly diseases = new Set<DiseaseType>();
  readonly diseaseCubeCount = new Map<DiseaseType, number>([
    ["red", 0],
    ["yellow", 0],
    ["blue", 0],
    ["black", 0],
  ]);

  get isInfected(): boolean {
    return this.diseases.size > 0;
  }

  constructor(
    public readonly name: CityName,
    public hasResearchStation: boolean = false
  ) {}

  isInfectedWith(diseaseType: DiseaseType): boolean {
    return this.diseases.has(diseaseType);
  }

  buildResearchStation(): void {
    this.hasResearchStation = true;
  }

  removeResearchStation(): void {
    this.hasResearchStation = false;
  }
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

  get researchStations(): readonly Readonly<City>[] {
    return this.graph.findVerticesWith<"hasResearchStation">(
      "hasResearchStation",
      true
    );
  }

  areCitiesNeighbours(city1: City | CityName, city2: City | CityName): boolean {
    const tempCity1 =
      typeof city1 === "string" ? this.getCityByName(city1) : city1;
    const tempCity2 =
      typeof city2 === "string" ? this.getCityByName(city2) : city2;
    return this.graph.areNeighbours(tempCity1, tempCity2);
  }

  getCityByName(name: CityName): Readonly<City> {
    {
      const city = this.graph.vertices.find((city) => city.name === name);
      if (city === undefined) {
        throw new Error("Could not find city. Error loading city config");
      }
      return city;
    }
  }

  getNeighbouringCities(city: City | CityName): Readonly<City>[] {
    const tempCity = typeof city === "string" ? this.getCityByName(city) : city;
    return this.graph.getNeighbours(tempCity);
  }

  *[Symbol.iterator](): IterableIterator<Readonly<City>> {
    for (const city of this.graph) {
      yield city;
    }
  }
}
