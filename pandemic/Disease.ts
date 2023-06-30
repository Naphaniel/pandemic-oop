import { City, CityNetwork } from "./City";
import { DeepReadonly } from "./Utils";

export type DiseaseType = "red" | "yellow" | "blue" | "black";
export type ReadonlyDiseaseManager = Omit<
  DeepReadonly<DiseaseManager>,
  | "registerObserver"
  | "removeObserver"
  | "epidemicAt"
  | "treatDiseaseAt"
  | "cureDisease"
  | "infect"
>;

type DiseaseState = "uncured" | "cured" | "eradicated";

export interface DiseaseObserver {
  onAllDiseasesCured(): void;
  onEightOutbreaks(): void;
  onNoDiseaseCubes(): void;
}

export class DiseaseManager {
  private static readonly NUM_DISEASE_CUBES_COLOUR = 24;

  private readonly globalDiseaseStates: Map<DiseaseType, DiseaseState>;
  private readonly globalDiseaseCubeCounts: Map<DiseaseType, number>;
  private readonly observers: DiseaseObserver[];
  private readonly outbreakedCities: Set<City>;
  private readonly infectionRateSequence: readonly number[];
  private infectionRateStep: number;
  outbreaks: number;

  constructor(private readonly cityNetwork: CityNetwork) {
    this.globalDiseaseStates = new Map<DiseaseType, DiseaseState>();
    this.globalDiseaseCubeCounts = new Map<DiseaseType, number>();
    this.observers = [];
    this.outbreakedCities = new Set<City>();
    this.infectionRateSequence = [2, 2, 2, 3, 3, 4, 4];
    this.infectionRateStep = 0;
    this.outbreaks = 0;
    this.initializeGlobalDiseaseStates();
    this.initializeGlobalDiseaseCubeCounts();
  }

  get infectionRate(): number {
    return this.infectionRateSequence[this.infectionRateStep];
  }

  private initializeGlobalDiseaseStates(): void {
    const diseaseTypes: DiseaseType[] = ["red", "yellow", "blue", "black"];
    for (const diseaseType of diseaseTypes) {
      this.globalDiseaseStates.set(diseaseType, "uncured");
    }
  }

  private initializeGlobalDiseaseCubeCounts(): void {
    const diseaseTypes: DiseaseType[] = ["red", "yellow", "blue", "black"];
    for (const diseaseType of diseaseTypes) {
      this.globalDiseaseCubeCounts.set(diseaseType, 0);
    }
  }

  getGlobalDiseaseStates(): ReadonlyMap<DiseaseType, DiseaseState> {
    return new Map(this.globalDiseaseStates);
  }

  getGlobalDiseaseCubeCounts(): ReadonlyMap<DiseaseType, number> {
    return new Map(this.globalDiseaseCubeCounts);
  }

  private areAllDiseasesCured(): boolean {
    for (const state of this.globalDiseaseStates.values()) {
      if (state === "uncured") {
        return false;
      }
    }
    return true;
  }

  private eradicateDisease(diseaseType: DiseaseType): void {
    this.globalDiseaseStates.set(diseaseType, "eradicated");
    if (this.areAllDiseasesCured()) {
      this.notifyAllCuresCured();
    }
  }

  private notifyEightOutbreaks(): void {
    for (const observer of this.observers) {
      observer.onEightOutbreaks();
    }
  }

  private notifyNoDiseaseCubes(): void {
    for (const observer of this.observers) {
      observer.onNoDiseaseCubes();
    }
  }

  private notifyAllCuresCured(): void {
    for (const observer of this.observers) {
      observer.onAllDiseasesCured();
    }
  }

  registerObserver(observer: DiseaseObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: DiseaseObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  private getGlobalDiseaseCubeCountOf(diseaseType: DiseaseType): number {
    return this.globalDiseaseCubeCounts.get(diseaseType) || 0;
  }

  private getGlobalDiseaseCubesLeftFor(diseaseType: DiseaseType): number {
    return (
      DiseaseManager.NUM_DISEASE_CUBES_COLOUR -
      this.getGlobalDiseaseCubeCountOf(diseaseType)
    );
  }

  getStateOf(diseaseType: DiseaseType): DiseaseState {
    return this.globalDiseaseStates.get(diseaseType) || "uncured";
  }

  epidemicAt(city: City, diseaseType: DiseaseType, count: number): void {
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

    const diseaseCubeCount = city.diseaseCubeCount.get(diseaseType) || 0;
    const diseaseState = this.getStateOf(diseaseType);

    switch (diseaseState) {
      case "eradicated":
        throw new Error(
          `Cannot treat disease. ${diseaseType} is already eradiacted.`
        );
      case "cured":
        city.diseaseCubeCount.set(diseaseType, 0);
        this.globalDiseaseCubeCounts.set(
          diseaseType,
          this.getGlobalDiseaseCubeCountOf(diseaseType) - diseaseCubeCount
        );
      case "uncured":
        city.diseaseCubeCount.set(diseaseType, diseaseCubeCount - count);
        this.globalDiseaseCubeCounts.set(
          diseaseType,
          this.getGlobalDiseaseCubeCountOf(diseaseType) - count
        );
      default:
    }

    if (city.diseaseCubeCount.get(diseaseType) === 0) {
      city.diseases.delete(diseaseType);
    }

    if (this.getGlobalDiseaseCubeCountOf(diseaseType) === 0) {
      this.eradicateDisease(diseaseType);
    }
  }

  cureDisease(diseaseType: DiseaseType): void {
    if (this.getStateOf(diseaseType) !== "uncured") {
      throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
    }

    this.globalDiseaseStates.set(diseaseType, "cured");

    if (this.areAllDiseasesCured()) {
      this.notifyAllCuresCured();
    }
  }

  infect(city: City, diseaseType: DiseaseType, count = 1): void {
    if (this.getStateOf(diseaseType) === "eradicated") {
      return;
    }

    if (this.getGlobalDiseaseCubesLeftFor(diseaseType) < 0) {
      this.notifyNoDiseaseCubes();
    }

    city.diseases.add(diseaseType);

    let newCityDiseaseCubeCount =
      (city.diseaseCubeCount.get(diseaseType) || 0) + count;

    if (newCityDiseaseCubeCount > 3) {
      newCityDiseaseCubeCount = 3;

      if (!this.outbreakedCities.has(city)) {
        this.outbreakAt(city, diseaseType);
      }
    }

    city.diseaseCubeCount.set(diseaseType, newCityDiseaseCubeCount);
    this.globalDiseaseCubeCounts.set(
      diseaseType,
      this.getGlobalDiseaseCubeCountOf(diseaseType) + count
    );
  }

  private outbreakAt(city: City, diseaseType: DiseaseType): void {
    const neighbours = this.cityNetwork.getNeighbouringCities(city);
    this.outbreakedCities.add(city);

    for (const neighbour of neighbours) {
      this.infect(neighbour, diseaseType, 1);
    }

    this.outbreakedCities.clear();
    this.outbreaks++;

    if (this.outbreaks === 8) {
      this.notifyEightOutbreaks();
    }
  }
}
