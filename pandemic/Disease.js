"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseManager = void 0;
class DiseaseManager {
    constructor(cityNetwork) {
        this.cityNetwork = cityNetwork;
        this.globalDiseaseStates = new Map();
        this.globalDiseaseCubeCounts = new Map();
        this.observers = [];
        this.outbreakedCities = new Set();
        this.infectionRateSequence = [2, 2, 2, 3, 3, 4, 4];
        this.infectionRateStep = 0;
        this.outbreaks = 0;
        this.initializeGlobalDiseaseStates();
        this.initializeGlobalDiseaseCubeCounts();
    }
    get infectionRate() {
        return this.infectionRateSequence[this.infectionRateStep];
    }
    initializeGlobalDiseaseStates() {
        const diseaseTypes = ["red", "yellow", "blue", "black"];
        for (const diseaseType of diseaseTypes) {
            this.globalDiseaseStates.set(diseaseType, "uncured");
        }
    }
    initializeGlobalDiseaseCubeCounts() {
        const diseaseTypes = ["red", "yellow", "blue", "black"];
        for (const diseaseType of diseaseTypes) {
            this.globalDiseaseCubeCounts.set(diseaseType, 0);
        }
    }
    getGlobalDiseaseStates() {
        return new Map(this.globalDiseaseStates);
    }
    getGlobalDiseaseCubeCounts() {
        return new Map(this.globalDiseaseCubeCounts);
    }
    areAllDiseasesCured() {
        for (const state of this.globalDiseaseStates.values()) {
            if (state === "uncured") {
                return false;
            }
        }
        return true;
    }
    eradicateDisease(diseaseType) {
        this.globalDiseaseStates.set(diseaseType, "eradicated");
        if (this.areAllDiseasesCured()) {
            this.notifyAllCuresCured();
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
    getGlobalDiseaseCubeCountOf(diseaseType) {
        return this.globalDiseaseCubeCounts.get(diseaseType) || 0;
    }
    getGlobalDiseaseCubesLeftFor(diseaseType) {
        return (DiseaseManager.NUM_DISEASE_CUBES_COLOUR -
            this.getGlobalDiseaseCubeCountOf(diseaseType));
    }
    getStateOf(diseaseType) {
        return this.globalDiseaseStates.get(diseaseType) || "uncured";
    }
    epidemicAt(city, diseaseType, count) {
        this.infectionRateStep = Math.min(this.infectionRateStep + 1, this.infectionRateSequence.length - 1);
        this.infect(city, diseaseType, count);
    }
    treatDiseaseAt(city, diseaseType, count = 1) {
        if (!city.isInfected) {
            throw new Error(`Cannot treat disease. ${city.name} is not infected`);
        }
        const diseaseCubeCount = city.diseaseCubeCount.get(diseaseType) || 0;
        const diseaseState = this.getStateOf(diseaseType);
        switch (diseaseState) {
            case "eradicated":
                throw new Error(`Cannot treat disease. ${diseaseType} is already eradiacted.`);
            case "cured":
                city.diseaseCubeCount.set(diseaseType, 0);
                this.globalDiseaseCubeCounts.set(diseaseType, this.getGlobalDiseaseCubeCountOf(diseaseType) - diseaseCubeCount);
            case "uncured":
                city.diseaseCubeCount.set(diseaseType, diseaseCubeCount - count);
                this.globalDiseaseCubeCounts.set(diseaseType, this.getGlobalDiseaseCubeCountOf(diseaseType) - count);
            default:
        }
        if (city.diseaseCubeCount.get(diseaseType) === 0) {
            city.diseases.delete(diseaseType);
        }
        if (this.getGlobalDiseaseCubeCountOf(diseaseType) === 0) {
            this.eradicateDisease(diseaseType);
        }
    }
    cureDisease(diseaseType) {
        if (this.getStateOf(diseaseType) !== "uncured") {
            throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
        }
        this.globalDiseaseStates.set(diseaseType, "cured");
        if (this.areAllDiseasesCured()) {
            this.notifyAllCuresCured();
        }
    }
    infect(city, diseaseType, count = 1) {
        if (this.getStateOf(diseaseType) === "eradicated") {
            return;
        }
        if (this.getGlobalDiseaseCubesLeftFor(diseaseType) < 0) {
            this.notifyNoDiseaseCubes();
        }
        city.diseases.add(diseaseType);
        let newCityDiseaseCubeCount = (city.diseaseCubeCount.get(diseaseType) || 0) + count;
        if (newCityDiseaseCubeCount > 3) {
            newCityDiseaseCubeCount = 3;
            if (!this.outbreakedCities.has(city)) {
                this.outbreakAt(city, diseaseType);
            }
        }
        city.diseaseCubeCount.set(diseaseType, newCityDiseaseCubeCount);
        this.globalDiseaseCubeCounts.set(diseaseType, this.getGlobalDiseaseCubeCountOf(diseaseType) + count);
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
}
exports.DiseaseManager = DiseaseManager;
DiseaseManager.NUM_DISEASE_CUBES_COLOUR = 24;
