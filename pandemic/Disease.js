"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseManager = void 0;
class DiseaseManager {
    get infectionRate() {
        return this.infectionRateSequence[this.infectionRateStep];
    }
    constructor(cityNetwork) {
        this.cityNetwork = cityNetwork;
        this.internalGlobalDiseaseStates = new Map([
            ["red", "uncured"],
            ["yellow", "uncured"],
            ["blue", "uncured"],
            ["black", "uncured"],
        ]);
        this.internalGlobalDiseaseCubeCounts = new Map([
            ["red", 0],
            ["yellow", 0],
            ["blue", 0],
            ["black", 0],
        ]);
        this.observers = [];
        this.outbreakedCities = new Set();
        this.infectionRateSequence = [2, 2, 2, 3, 3, 4, 4];
        this.infectionRateStep = 0;
        this.outbreaks = 0;
    }
    get globalDiseaseStates() {
        return this.internalGlobalDiseaseStates;
    }
    get globalDiseaseCubeCounts() {
        return this.internalGlobalDiseaseCubeCounts;
    }
    get areAllDiseasesCured() {
        return !(this.stateOf("red") === "uncured" ||
            this.stateOf("blue") === "uncured" ||
            this.stateOf("black") === "uncured" ||
            this.stateOf("yellow") === "uncured");
    }
    eradicateDisease(diseaseType) {
        this.setStateOf(diseaseType, "eradicated");
        if (this.areAllDiseasesCured) {
            this.notifyAllCuresCured();
        }
    }
    setStateOf(diseaseType, state) {
        this.internalGlobalDiseaseStates.set(diseaseType, state);
    }
    outbreakAt(city, diseaseType) {
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
    notifyEightOutbreaks() {
        for (const observer of this.observers) {
            observer.onEightOutbreaks();
        }
    }
    notifyNoDiseaseCubes() {
        for (const observer of this.observers) {
            observer.onNoDiseaseCubes();
        }
    }
    notifyAllCuresCured() {
        for (const observer of this.observers) {
            observer.onAllDiseasesCured();
        }
    }
    registerObserver(observer) {
        this.observers.push(observer);
    }
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }
    globalDisaseCubeCountOf(diseaseType) {
        return this.globalDiseaseCubeCounts.get(diseaseType) ?? 0;
    }
    globalDiseaseCubesLeftFor(diseaseType) {
        return (DiseaseManager.NUM_DISEASE_CUBES_COLOUR -
            this.globalDisaseCubeCountOf(diseaseType));
    }
    stateOf(diseaseType) {
        return this.internalGlobalDiseaseStates.get(diseaseType) ?? "uncured";
    }
    epidemicAt(city, diseaseType, count) {
        this.infectionRateStep = Math.min(this.infectionRateStep + 1, this.infectionRateSequence.length - 1);
        this.infect(city, diseaseType, count);
    }
    treatDiseaseAt(city, diseaseType, count = 1) {
        if (!city.isInfected) {
            throw new Error(`Cannot treat disease. ${city.name} is not infected`);
        }
        const diseaseCubeCount = city.diseaseCubeCount.get(diseaseType) ?? 0;
        const diseaseState = this.stateOf(diseaseType);
        switch (diseaseState) {
            case "eradicated":
                if (diseaseState === "eradicated") {
                    throw new Error(`Cannot treat disease. ${diseaseType} is already eradiacted.`);
                }
            case "cured":
                city.diseaseCubeCount.set(diseaseType, 0);
                this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.globalDisaseCubeCountOf(diseaseType) - diseaseCubeCount);
            case "uncured":
                city.diseaseCubeCount.set(diseaseType, diseaseCubeCount - count);
                this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.globalDisaseCubeCountOf(diseaseType) - count);
            default:
        }
        if (city.diseaseCubeCount.get(diseaseType) === 0) {
            city.diseases.delete(diseaseType);
        }
        if (this.globalDisaseCubeCountOf(diseaseType) === 0) {
            this.eradicateDisease(diseaseType);
        }
    }
    cureDisease(diseaseType) {
        if (!(this.stateOf(diseaseType) === "uncured")) {
            throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
        }
        this.setStateOf(diseaseType, "cured");
        if (this.areAllDiseasesCured) {
            this.notifyAllCuresCured();
        }
    }
    infect(city, diseaseType, count = 1) {
        if (this.stateOf(diseaseType) === "eradicated") {
            return;
        }
        if (this.globalDiseaseCubesLeftFor(diseaseType) < count) {
            this.notifyNoDiseaseCubes();
        }
        city.diseases.add(diseaseType);
        let newCityDiseaseCubeCount = (city.diseaseCubeCount.get(diseaseType) ?? 0) + count;
        if (newCityDiseaseCubeCount > 3) {
            newCityDiseaseCubeCount = 3;
            if (!this.outbreakedCities.has(city)) {
                this.outbreakAt(city, diseaseType);
            }
        }
        city.diseaseCubeCount.set(diseaseType, newCityDiseaseCubeCount);
        this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.globalDisaseCubeCountOf(diseaseType) + count);
    }
}
exports.DiseaseManager = DiseaseManager;
DiseaseManager.NUM_DISEASE_CUBES_COLOUR = 24;
