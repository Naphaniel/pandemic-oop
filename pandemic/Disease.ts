import { City, CityNetwork } from "./City";

export type ReadonlyDiseaseManager = Readonly<
  Omit<
    DiseaseManager,
    | "setStateOf"
    | "treatDiseaseAt"
    | "cureDisease"
    | "eradicateDisease"
    | "infect"
    | "outbreakAt"
    | "epidemicAt"
  >
>;
export type DiseaseType = "red" | "yellow" | "blue" | "black";
type DiseaseState = "uncured" | "cured" | "eradicated";

export class DiseaseManager {
  private internalGlobalDiseaseStates = new Map<DiseaseType, DiseaseState>([
    ["red", "uncured"],
    ["yellow", "uncured"],
    ["blue", "uncured"],
    ["black", "uncured"],
  ]);

  private internalGlobalDiseaseCubeCounts = new Map<DiseaseType, number>([
    ["red", 0],
    ["yellow", 0],
    ["blue", 0],
    ["black", 0],
  ]);

  private outbreakedCities = new Set<City>();
  private readonly infectionRateSequence = [2, 2, 2, 3, 3, 4, 4] as const;
  private infectionRateStep = 0;

  outbreaks = 0;

  get infectionRate() {
    return this.infectionRateSequence[this.infectionRateStep];
  }

  constructor(private readonly cityNetwork: CityNetwork) {}

  get globalDiseaseStates(): ReadonlyMap<DiseaseType, DiseaseState> {
    return this.internalGlobalDiseaseStates;
  }

  get globalDiseaseCubeCounts(): ReadonlyMap<DiseaseType, number> {
    return this.internalGlobalDiseaseCubeCounts;
  }

  private eradicateDisease(diseaseType: DiseaseType): void {
    this.setStateOf(diseaseType, "eradicated");
  }

  disaseCubeCountOf(diseaseType: DiseaseType): number {
    return this.globalDiseaseCubeCounts.get(diseaseType) ?? 0;
  }

  stateOf(diseaseType: DiseaseType): DiseaseState {
    return this.internalGlobalDiseaseStates.get(diseaseType) ?? "uncured";
  }

  setStateOf(diseaseType: DiseaseType, state: DiseaseState): void {
    this.internalGlobalDiseaseStates.set(diseaseType, state);
  }

  epidemicAt(city: City, diseaseType: DiseaseType, count: number) {
    this.infectionRateStep = Math.min(
      this.infectionRateStep + 1,
      this.infectionRateSequence.length - 1
    );
    this.infect(city, diseaseType, count);
  }

  treatDiseaseAt(city: City, diseaseType: DiseaseType, count = 1): void {
    if (!city.isInfected) {
      throw new Error(`Cannot treat disease. ${city.name} is not infected`);
    }
    const diseaseCubeCount = city.diseaseCubeCount.get(diseaseType) ?? 0;
    const diseaseState = this.stateOf(diseaseType);
    switch (diseaseState) {
      case "eradicated":
        if (diseaseState === "eradicated") {
          throw new Error(
            `Cannot treat disease. ${diseaseType} is already eradiacted.`
          );
        }
      case "cured":
        city.diseaseCubeCount.set(diseaseType, 0);
        this.internalGlobalDiseaseCubeCounts.set(
          diseaseType,
          this.disaseCubeCountOf(diseaseType) - diseaseCubeCount
        );
      case "uncured":
        city.diseaseCubeCount.set(diseaseType, diseaseCubeCount - count);
        this.internalGlobalDiseaseCubeCounts.set(
          diseaseType,
          this.disaseCubeCountOf(diseaseType) - count
        );
      default:
    }
    if (city.diseaseCubeCount.get(diseaseType) === 0) {
      city.diseases.delete(diseaseType);
    }
    if (this.disaseCubeCountOf(diseaseType) === 0) {
      this.eradicateDisease(diseaseType);
    }
  }

  cureDisease(diseaseType: DiseaseType): void {
    if (!(this.stateOf(diseaseType) === "uncured")) {
      throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
    }
    this.setStateOf(diseaseType, "cured");
  }

  outbreakAt(city: City, diseaseType: DiseaseType): void {
    const neighbours = this.cityNetwork.getNeighbouringCities(city);
    this.outbreakedCities.add(city);
    for (const neighbour of neighbours) {
      this.infect(neighbour, diseaseType, 1);
    }
    this.outbreakedCities.clear();
    this.outbreaks++;
  }

  infect(city: City, diseaseType: DiseaseType, count = 1): void {
    if (this.stateOf(diseaseType) === "eradicated") {
      return;
    }
    city.diseases.add(diseaseType);
    let newCityDiseaseCubeCount =
      (city.diseaseCubeCount.get(diseaseType) ?? 0) + count;
    if (newCityDiseaseCubeCount > 3) {
      newCityDiseaseCubeCount = 3;
      if (!this.outbreakedCities.has(city)) {
        this.outbreakAt(city, diseaseType);
      }
    }
    city.diseaseCubeCount.set(diseaseType, newCityDiseaseCubeCount);
    this.internalGlobalDiseaseCubeCounts.set(
      diseaseType,
      this.disaseCubeCountOf(diseaseType) + count
    );
  }
}
