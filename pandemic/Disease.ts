import { City, CityNetwork } from "./City";
import { DeepReadonly } from "./Utils";

/**
 * Exported type used to represent the 4 types of diseases.
 */
export type DiseaseType = "red" | "yellow" | "blue" | "black";

/**
 * External type that provides readonly access to {@link DiseaseManager} by
 * using in built type Omit and a custom type {@link DeepReadonly} that
 * recursively makes a type readonly. We further encapsulate the {@link DiseaseManager}
 * removing all of the state changing methods so they are not visible externally.
 */
export type ReadonlyDiseaseManager = Omit<
  DeepReadonly<DiseaseManager>,
  | "registerObserver"
  | "removeObserver"
  | "epidemicAt"
  | "treatDiseaseAt"
  | "cureDisease"
  | "infect"
>;

/**
 * Internal type used to represent the 3 types of disease state.
 */
type DiseaseState = "uncured" | "cured" | "eradicated";

/**
 * External interface used as part of the **Observer (pub-sub) Pattern**
 * Classes that implement this interface will fulfill this contract and can
 * be considered as {@link DiseaseObserver}. Classes that are registered as
 * {@link DiseaseObserver} will be notified on 3 events related to Diseases.
 * In this case, the Game state classs implements this interface to determine
 * win/loss game states.
 *
 * Following this approarch means that the {@link DiseaseManager} is not
 * strongly coupled through a strong reference to an observer (such as the game)
 * and instead we can simply send events to anyone registered.
 */
export interface DiseaseObserver {
  onAllDiseasesCured(): void;
  onEightOutbreaks(): void;
  onNoDiseaseCubes(): void;
}

/**
 * Exported class which is responsible for controling the state of diseases in the game.
 *
 * @remarks
 * As this class is exported we pay extra attention to what class members are
 * visible for public consumption through access modifiers and method return
 * types.
 *
 * Implements the **Observer Pattern** through notifying observers of 3 types
 * of event {@link DiseaseManager.notifyAllCuresCured},
 * {@link DiseaseManager.notifyEightOutbreaks} and {@link DiseaseManager.notifyNoDiseaseCubes}
 */
export class DiseaseManager {
  /**
   * Internal constant used to configure the number of disease cubes possible
   * for each disease type.
   */
  private static readonly NUM_DISEASE_CUBES_COLOUR = 24;

  /**
   * Almost all of these members are private and cannot be reassigned. The data
   * structures (i.e Map, array and Sets) remain mutable however this is safe
   * as they are private to the class so cannot be misused.
   *
   * The outbreak member is public and mutable internally but is exposed for
   * external use through {@link ReadonlyDiseaseManager} which makes it immutable.
   */
  private readonly globalDiseaseStates: Map<DiseaseType, DiseaseState>;
  private readonly globalDiseaseCubeCounts: Map<DiseaseType, number>;
  private readonly observers: DiseaseObserver[];
  private readonly outbreakedCities: Set<City>;
  private readonly infectionRateSequence: readonly number[];
  private infectionRateStep: number;
  outbreaks: number;

  /**
   * Gets the current infection rate value.
   *
   * @returns The current infection rate value.
   *
   * @remarks
   * As the {@link DiseaseManager.infectionRateSequence} is private, we
   * expose what we need in a calculation safely using this getter.
   */
  get infectionRate(): number {
    return this.infectionRateSequence[this.infectionRateStep];
  }

  /**
   * Public constructor for typical instantiation of the {@link DiseaseManager}.
   *
   * @param cityNetwork - Reference to the {@link CityNetwork} being used in
   * the game.
   *
   * @remarks
   * Here we initiate all of the default values for the class members and delegate
   * the initialization of more complex members to other private class methods,
   * {@link DiseaseManager.initializeGlobalDiseaseStates},
   * {@link DiseaseManager.initializeGlobalDiseaseCubeCounts}
   *
   * Note here we use constuctor assignment to initialise private readonly member
   * called cityNetwork. We opt to do this instead of passing in the whole
   * Game object as this is more lightweight and we can make better use of
   * depdency injection to make a 'looser' coupling.
   *
   * Note also we use TypeScript built-in `Map` rather than objects to act
   * as a dictionary as they are faster and provide more type safety as standard
   * as well more concise compilation errors.
   */
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

  // ACCESSORS & HELPERS

  /**
   * Internal utility method used to initialize {@link DiseaseManager.globalDiseaseStates}
   */
  private initializeGlobalDiseaseStates(): void {
    const diseaseTypes: DiseaseType[] = ["red", "yellow", "blue", "black"];
    for (const diseaseType of diseaseTypes) {
      this.globalDiseaseStates.set(diseaseType, "uncured");
    }
  }

  /**
   * Internal utility method used to initialize {@link DiseaseManager.globalDiseaseCubeCounts}
   */
  private initializeGlobalDiseaseCubeCounts(): void {
    const diseaseTypes: DiseaseType[] = ["red", "yellow", "blue", "black"];
    for (const diseaseType of diseaseTypes) {
      this.globalDiseaseCubeCounts.set(diseaseType, 0);
    }
  }

  /**
   * Gets an immutable version of {@link DiseaseManager.globalDiseaseStates}
   *
   * @returns An immutable map containing the states of each disease.
   *
   * @remarks
   * To safely expose {@link DiseaseManager.globalDiseaseStates} we use
   * TypeScripts `ReadonlyMap` interface which makes a standard `Map` immutable.
   */
  getGlobalDiseaseStates(): ReadonlyMap<DiseaseType, DiseaseState> {
    return new Map(this.globalDiseaseStates);
  }

  /**
   * Gets an immutable version of {@link DiseaseManager.globalDiseaseCubeCounts}
   *
   * @returns An immutable map containing the cube counts of each disease.
   *
   * @remarks
   * To safely expose {@link DiseaseManager.globalDiseaseCubeCounts} we use
   * TypeScripts `ReadonlyMap` interface which makes a standard `Map` immutable.
   */
  getGlobalDiseaseCubeCounts(): ReadonlyMap<DiseaseType, number> {
    return new Map(this.globalDiseaseCubeCounts);
  }

  /**
   * Checks whether all of the diseases have been cured.
   *
   * @returns `true` if all of the disease have been cured, `false` otherwise.
   */
  private areAllDiseasesCured(): boolean {
    for (const state of this.globalDiseaseStates.values()) {
      if (state === "uncured") {
        return false;
      }
    }
    return true;
  }

  /**
   * Gets the global disease cube count of a {@link DiseaseType}.
   *
   * @param diseaseType - The {@link DiseaseType} to get the disease cube count for.
   * @returns The number of disease cubes on the board for {@link diseaseType}
   *
   * @remarks
   * Note that if the {@link diseaseType} can't be found in
   * {@link DiseaseManager.globalDiseaseCubeCounts} then we default to 0.
   * This however should never happen as we initialise
   * {@link DiseaseManager.globalDiseaseCubeCounts} with all of the diseases present
   */
  private getGlobalDiseaseCubeCountOf(diseaseType: DiseaseType): number {
    return this.globalDiseaseCubeCounts.get(diseaseType) || 0;
  }

  /**
   * Gets the number of disease cubes available for placement for {@link DiseaseType}
   *
   * @param diseaseType - The {@link DiseaseType} to get the cubes left for.
   * @returns The number of disease cubes available for {@link diseaseType}
   */
  private getGlobalDiseaseCubesLeftFor(diseaseType: DiseaseType): number {
    return (
      DiseaseManager.NUM_DISEASE_CUBES_COLOUR -
      this.getGlobalDiseaseCubeCountOf(diseaseType)
    );
  }

  /**
   * Gets the {@link DiseaseState} for a {@link DiseaseType}.
   *
   * @param diseaseType - The {@link DiseaseType} to get the state of.
   * @returns The {@link DiseaseState} for the {@link DiseaseType}
   *
   * @remarks
   * As {@link DiseaseManager.globalDiseaseStates} is encapsulated and private
   * we expose it safely through this method to avoid exposing internal state.
   */
  getStateOf(diseaseType: DiseaseType): DiseaseState {
    return this.globalDiseaseStates.get(diseaseType) || "uncured";
  }

  // ---- GAME LOGIC ----

  /**
   * Eradicates a disease.
   *
   * @param diseaseType - The {@link DiseaseType} to eradicate.
   *
   * @remarks
   * If, once a disease has been eradicated, all of the diseases have been
   * at least cured, following the **Observer (pub/sub) Pattern** all observers
   * of {@link DiseaseManager} are notified. Promoting a loose coupling between
   * the {@link DiseaseManager} and it's observers
   */
  private eradicateDisease(diseaseType: DiseaseType): void {
    this.globalDiseaseStates.set(diseaseType, "eradicated");
    if (this.areAllDiseasesCured()) {
      this.notifyAllCuresCured();
    }
  }

  /**
   * Starts an epidemic at a city.
   *
   * @param city - The {@link City} to start an epidemic at.
   * @param diseaseType - The {@link DiseaseType} of the epidemic.
   * @param count - The number of disease cubes to infect a city with.
   */
  epidemicAt(city: City, diseaseType: DiseaseType, count: number): void {
    this.infectionRateStep = Math.min(
      this.infectionRateStep + 1,
      this.infectionRateSequence.length - 1
    );
    this.infect(city, diseaseType, count);
  }

  /**
   * Treats a disease at a city by removing a given number of disease cubes.
   *
   * @param city - The {@link City} to treat.
   * @param diseaseType - The {@link DiseaseType} to treat.
   * @param count - The number of disease cubes to remove, defaulted to 1.
   * @throws {Error} if the {@link City} is not infected.
   * @throws {Error} if the {@link diseaseType} is already eradicated.
   */
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

  /**
   * Attempts to curse a disease.
   *
   * @param diseaseType - The {@link DiseaseType} to try and cure.
   * @throws {Error} if the {@link DiseaseType} is already cured.
   *
   * @remarks
   * If  all of the diseases have been at least cured, following the
   * **Observer (pub/sub) Pattern** all observers of {@link DiseaseManager}
   * are notified. Promoting a loose coupling between the {@link DiseaseManager}
   * and it's observers.
   */
  cureDisease(diseaseType: DiseaseType): void {
    if (this.getStateOf(diseaseType) !== "uncured") {
      throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
    }

    this.globalDiseaseStates.set(diseaseType, "cured");

    if (this.areAllDiseasesCured()) {
      this.notifyAllCuresCured();
    }
  }

  /**
   * Attempts to infect a city with a disease.
   *
   * @param city - The {@link City} to infect.
   * @param diseaseType - The {@link DiseaseType} to infect with.
   * @param count - The number of disease cubes to add, defaulted to 1.
   *
   * @remarks
   * If there are no disease cubes available to add, following the
   * **Observer (pub/sub) Pattern** all observers of {@link DiseaseManager}
   * are notified. Promoting a loose coupling between the {@link DiseaseManager}
   * and it's observers.
   */
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

  /**
   * Causes an outbreak at a specific city.
   *
   * @param city - The {@link City} to cause an outbreak.
   * @param diseaseType - The {@link DiseaseType} to outbreak with.
   *
   * @remarks
   * Note here we perform a Depth First Search (DFS) on the {@link CityNetwork}
   * to navigate the network, infecting applicable cities. We avoid visiting
   * duplicate cities by tracking the cities we have visited in
   * {@link DiseaseManager.outbreakedCities}. Thanks to using a graph we
   * can visit at most all of the cities in O(V+E) where V = cities and
   * E = connections.
   *
   * If there have been 8 or more outbreaks, following the
   * **Observer (pub/sub) Pattern** all observers of {@link DiseaseManager}
   * are notified. Promoting a loose coupling between the {@link DiseaseManager}
   * and it's observers.
   */
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

  // ---- OBSERVER PATTERN ----

  /**
   * Notifies all observers that eight outbreaks have occured.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of
   * {@link DiseaseManager} are notified. Promoting a loose coupling between
   * the {@link DiseaseManager} and it's observers
   */
  private notifyEightOutbreaks(): void {
    for (const observer of this.observers) {
      observer.onEightOutbreaks();
    }
  }

  /**
   * Notifies all observers that no disease cubes of a colour are left.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of
   * {@link DiseaseManager} are notified. Promoting a loose coupling between
   * the {@link DiseaseManager} and it's observers
   */
  private notifyNoDiseaseCubes(): void {
    for (const observer of this.observers) {
      observer.onNoDiseaseCubes();
    }
  }

  /**
   * Notifies all observers that all cures have been discovered.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of
   * {@link DiseaseManager} are notified. Promoting a loose coupling between
   * the {@link DiseaseManager} and it's observers
   */
  private notifyAllCuresCured(): void {
    for (const observer of this.observers) {
      observer.onAllDiseasesCured();
    }
  }

  /**
   * Registers an observer to {@link DiseaseManager}.
   *
   * @param observer - The observer to register.
   *
   * @remarks
   * Required plumbing for the **Observer (pub/sub) Pattern**
   * This method is not exposed when the {@link DiseaseManager} is exposed
   * through {@link ReadonlyDiseaseManager} so it cannot be misused.
   */
  registerObserver(observer: DiseaseObserver): void {
    this.observers.push(observer);
  }

  /**
   * Removes an observer from {@link DiseaseManager}.
   *
   * @param observer - The observer to remove.
   *
   * @remarks
   * Required plumbing for the **Observer (pub/sub) Pattern**
   * This method is not exposed when the {@link DiseaseManager} is exposed
   * through {@link ReadonlyDiseaseManager} so it cannot be misused.
   */
  removeObserver(observer: DiseaseObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
}
