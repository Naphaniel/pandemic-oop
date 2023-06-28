import { City } from "./City";

export type ReadonlyDiseaseManager = Readonly<
  Omit<
    DiseaseManager,
    | "setStateOf"
    | "treatDiseaseAt"
    | "cureDisease"
    | "eradicateDisease"
    | "infect"
    | "outbreak"
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

  outbreaks = 0;
  infectionRate = 0;

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
    this.infectionRate++;
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

  outbreak(): void {}

  infect(city: City, diseaseType: DiseaseType, count = 1): void {
    city.diseases.add(diseaseType);
    let newCityDiseaseCubeCount =
      (city.diseaseCubeCount.get(diseaseType) ?? 0) + count;
    if (newCityDiseaseCubeCount > 3) {
      newCityDiseaseCubeCount = 3;
      this.outbreak();
    }
    city.diseaseCubeCount.set(diseaseType, newCityDiseaseCubeCount);
    this.internalGlobalDiseaseCubeCounts.set(
      diseaseType,
      this.disaseCubeCountOf(diseaseType) + count
    );
  }
}
