import fs from "fs";
import { Graph } from "./Graph";
import { DiseaseType } from "./Disease";
import { DeepReadonly } from "./Utils";

/**
 * Exported type used to represent all of the city names in the {@link CityNetwork}
 */
export type CityName = "atalanta" | "london";

/**
 * Exported type that provides readonly access to {@link City} by using in built
 * type Omit and a custom type {@link DeepReadonly} that recursively makes a
 * type readonly. We further encapsulate the {@link City} by modifying all of
 * the state changing methods/members to ones that expose/return readonly variants.
 */
export type ReadonlyCity = Omit<
  DeepReadonly<City>,
  "diseases" | "diseaseCubeCount"
> & {
  readonly diseases: ReadonlySet<DiseaseType>;
  readonly diseaseCubeCount: ReadonlyMap<DiseaseType, number>;
};

/**
 * Exported type that provides readonly access to {@link CityNetwork} by
 * creating readonly variants of members and methods we want to expose
 * within {@link CityNetwork}
 */
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

/**
 * Internal interface that represents the structure of the JSON data used
 * to build the {@link CityNetwork} from a file in {@link CityNetwork.buildFromFile}
 */
interface CityFileData {
  readonly name: CityName;
  readonly neighbours: CityName[];
}

/**
 * A lightweight class that contains the state and methods that represent
 * a city within the pandemic game.
 *
 * @remarks
 * This class could've have been a lighterweight interface/type but due to
 * the slight complexities within the disease and cube count data we opt
 * to use a Class. Semantically it is also more descriptive.
 *
 * As this class is exported and the consumer of our library will be able
 * to access the City objects through a variety of ways, we pay extra attention
 * to what is accessible. For internal use we allow the inner data to be mutated
 * but to ensure that it can't be misued we make the state immutable through
 * {@link ReadonlyCity}
 */
export class City {
  /**
   * These members remaing mutable and accessible to users of the class, however
   * in situations where we want these to be immutable/inaccessible we use the
   * {@link ReadonlyCity} type.
   */
  readonly diseases = new Set<DiseaseType>();
  readonly diseaseCubeCount = new Map<DiseaseType, number>([
    ["red", 0],
    ["yellow", 0],
    ["blue", 0],
    ["black", 0],
  ]);

  /**
   * Gets whether the city is infected or not.
   *
   * @returns `true` if the city is infected, `false` otherwise.
   */
  get isInfected(): boolean {
    return this.diseases.size > 0;
  }

  /**
   * Public constructor for typical instantiation of the {@link City}.
   *
   * @param name - The name of the city.
   * @param hasResearchStation - flag indicating whether a city has a research station.
   *
   * @remarks
   * Not here we use constructor assignment to initialise the name and hasResearchStation
   * members. We enforce immutability to external consumers through the {@link ReadonlyCity}
   * type.
   */
  constructor(
    public readonly name: CityName,
    public hasResearchStation: boolean = false
  ) {}

  // ---- UTILS & ACCESSORS ----

  /**
   * Gets whether the city is infected with a specific disease.
   *
   * @returns `true` if the city is infected with specific {@link DiseaseType},
   * `false` otherwise.
   *
   * @remarks
   * We use a method here to access this value instead of exposing {@link City.disease}
   * directly. Promoting encapsulation and preventing misuse.
   */
  isInfectedWith(diseaseType: DiseaseType): boolean {
    return this.diseases.has(diseaseType);
  }
}

/**
 * Exported class that represents the game board in the form of a {@link Graph}
 * of {@link City}, called a {@link CityNetwork}.
 *
 * @remarks
 * This class is used to handle queries of cities and relationships between
 * cities. The graph data structure allows us to efficiently build a network
 * of cities that we can navigate and easily check whether cities are neighbours.
 */
export class CityNetwork {
  /**
   * Private internal {@link Graph} to store the {@link City} in the network.
   * We make this private so the internal data cannot be accessed incorrectly
   * and misused.
   */
  private readonly graph = new Graph<City>();

  /**
   * Utility method to build a new {@link CityNetwork} from a given JSON file.
   *
   * @param path - File path to the data file.
   * @returns A new {@link CityNetwork} instance built from the file.
   */
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

  /**
   * Getter to get all of the {@link City} with a research station built.
   *
   * @returns A readonly array of {@link City} where research stations have been
   * built.
   *
   * @remarks
   * Note that using readonly here does not make the types stored in the array
   * readonly also. Instead we use the {@link ReadonlyCityNetwork} type
   * to modify this method to return an array of {@link ReadonlyCity} for external use.
   */
  get researchStations(): readonly City[] {
    return this.graph.findVerticesWith("hasResearchStation", true);
  }

  /**
   * Getter to get the number of research stations placed.
   *
   * @returns The total number of researh stations built.
   */
  get researchStationsPlaced(): number {
    return this.researchStations.length;
  }

  /**
   * Getter to get all of the cities in the {@link CityNetwork}.
   *
   * @returns An array contianing all of the {@link City} in the {@link CityNetwork}.
   *
   * @remarks
   * Note that using readonly here does not make the types stored in the array
   * readonly also. Instead we use the {@link ReadonlyCityNetwork} type
   * to modify this method to return an array of {@link ReadonlyCity} for external use.
   */
  get cities(): readonly City[] {
    return this.graph.vertices;
  }

  // ---- LOGIC ----

  /**
   * Private utility method used by {@link CityNetwork.buildfromFile} to add
   * a city to the {@link CityNetwork}
   *
   * @param city - The {@link City} to add.
   *
   * @remarks
   * We can make this method private as the {@link CityNetwork} does not
   * need to be modified after construction as the game board does not change.
   */
  private addCity(city: City): void {
    if (!this.graph.hasVertex(city)) {
      this.graph.addVertex(city);
    }
  }

  /**
   * Private utility method used by {@link CityNetwork.buildFromFile} to add
   * a neighbour to a {@link City} in the {@link CityNetwork}.
   *
   * @param city - The {@link City} to add a neighbour to.
   * @param neighBourCity - The neighbour to add.
   *
   * @remarks
   * We can make this method private as the {@link CityNetwork} does not
   * need to be modified after construction as the game board does not change.
   */
  private addNeighbour(city: City, neighbourCity: City): void {
    this.graph.addEdge(city, neighbourCity);
  }

  /**
   * Checks whether two cities are neighbours.
   *
   * @param city1 - The first {@link City} of the pair.
   * @param city2 - the second {@link City} of the pair.
   * @returns `true` if the cities are neighbours, `false` otherwise.
   *
   * @remarks
   * The use of a {@link Graph} allows to to efficiently check whther
   * cities are neighbours (adjacent) in O(1) time.
   */
  areCitiesNeighbours(city1: City | CityName, city2: City | CityName): boolean {
    const tempCity1 =
      typeof city1 === "string" ? this.getCityByName(city1) : city1;
    const tempCity2 =
      typeof city2 === "string" ? this.getCityByName(city2) : city2;
    return this.graph.areNeighbours(tempCity1, tempCity2);
  }

  /**
   * Gets the {@link City} object for a {@link CityName}.
   *
   * @param name - The name of the {@link City} to find.
   * @returns The {@link City} with the corresponding {@link CityName}
   * @throws {Error} if a {@link City} with {@link CityName} could not be found.
   *
   * @remarks
   * As we are strictly typing all of the {@link CityName} and building the
   * {@link CityNetwork} from a file, the only way this can throw an error is
   * if the config file does not match the {@link CityName} type or an error
   * occured building the {@link CityNetwork}
   *
   * We use the {@link ReadonlyCityNetwork} type to modify this method to return
   * a {@link ReadonlyCity} for external use.
   */
  getCityByName(name: CityName): City {
    const city = this.graph.vertices.find((city) => city.name === name);
    if (city === undefined) {
      throw new Error("Could not find city. Error loading city config");
    }
    return city;
  }

  /**
   * Gets the neighbours of a {@link City}.
   *
   * @param city - The {@link City} to get the neighbours of.
   * @returns An array containing all of neighbouring {@link City}.
   *
   * @remarks
   * Note that using readonly here does not make the types stored in the array
   * readonly also. Instead we use the {@link ReadonlyCityNetwork} type
   * to modify this method to return an array of {@link ReadonlyCity} for external use.
   */
  getNeighbouringCities(city: City | CityName): City[] {
    const tempCity = typeof city === "string" ? this.getCityByName(city) : city;
    return this.graph.getNeighbours(tempCity);
  }

  // ---- UTILS ----

  /**
   * Returns an iterator for all of the {@link City} in the {@link CityNetwork},
   * which enables iteration using a `for...of` loop.
   *
   * @remarks
   * This enables consumers to iterate over the {@link CityNetwork} without being
   * concerned about the underlying implementation of the {@link CityNetwork}. i.e
   * we could change the {@link Graph} to another data structure and the interface
   * would not change.
   */
  *[Symbol.iterator](): IterableIterator<City> {
    yield* this.graph.vertices;
  }
}
