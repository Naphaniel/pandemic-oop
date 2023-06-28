import { City } from "./City";

export type ReadonlyDiseaseManager = Readonly<
  Omit<
    DiseaseManager,
    | "setStateOf"
    | "treatDiseaseAt"
    | "cureDisease"
    | "eradicateDisease"
    | "infect"
  >
>;
export type DiseaseType = "none" | "red" | "yellow" | "blue" | "black";
type DiseaseState = "uncured" | "cured" | "eradicated";

export class DiseaseManager {
  private internalDiseaseStates = new Map<DiseaseType, DiseaseState>([
    ["red", "uncured"],
    ["yellow", "uncured"],
    ["blue", "uncured"],
    ["black", "uncured"],
  ]);

  private internalDiseaseCubeCounts = new Map<DiseaseType, number>([
    ["red", 0],
    ["yellow", 0],
    ["blue", 0],
    ["black", 0],
  ]);

  outbreaks = 0;
  infectionRate = 0;

  get diseaseStates(): ReadonlyMap<DiseaseType, DiseaseState> {
    return this.internalDiseaseStates;
  }

  get diseaseCubeCounts(): ReadonlyMap<DiseaseType, number> {
    return this.internalDiseaseCubeCounts;
  }

  private eradicateDisease(diseaseType: DiseaseType): void {
    this.setStateOf(diseaseType, "eradicated");
  }

  disaseCubeCountOf(diseaseType: DiseaseType): number {
    return this.diseaseCubeCounts.get(diseaseType) ?? 0;
  }

  stateOf(diseaseType: DiseaseType): DiseaseState {
    return this.internalDiseaseStates.get(diseaseType) ?? "uncured";
  }

  setStateOf(diseaseType: DiseaseType, state: DiseaseState): void {
    this.internalDiseaseStates.set(diseaseType, state);
  }

  treatDiseaseAt(city: City, count = 1): void {
    if (!city.isInfected) {
      throw new Error(`Cannot treat disease. ${city.name} is not infected`);
    }
    const { diseaseType, diseaseCubeCount } = city;
    const diseaseState = this.stateOf(diseaseType);
    switch (diseaseState) {
      case "eradicated":
        if (diseaseState === "eradicated") {
          throw new Error(
            `Cannot treat disease. ${diseaseType} is already eradiacted.`
          );
        }
      case "cured":
        city.diseaseCubeCount = 0;
        this.internalDiseaseCubeCounts.set(
          diseaseType,
          this.disaseCubeCountOf(diseaseType) - diseaseCubeCount
        );
      case "uncured":
        city.diseaseCubeCount -= count;
        this.internalDiseaseCubeCounts.set(
          diseaseType,
          this.disaseCubeCountOf(diseaseType) - count
        );
      default:
    }
    if (city.diseaseCubeCount === 0) {
      city.diseaseType = "none";
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

  infect(city: City, diseaseType: DiseaseType, count = 1): void {
    city.diseaseType = diseaseType;
    city.diseaseCubeCount += count;
    this.internalDiseaseCubeCounts.set(
      diseaseType,
      this.disaseCubeCountOf(diseaseType) + count
    );
  }
}
