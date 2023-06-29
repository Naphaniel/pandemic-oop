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
    eradicateDisease(diseaseType) {
        this.setStateOf(diseaseType, "eradicated");
    }
    disaseCubeCountOf(diseaseType) {
        return this.globalDiseaseCubeCounts.get(diseaseType) ?? 0;
    }
    stateOf(diseaseType) {
        return this.internalGlobalDiseaseStates.get(diseaseType) ?? "uncured";
    }
    setStateOf(diseaseType, state) {
        this.internalGlobalDiseaseStates.set(diseaseType, state);
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
                this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) - diseaseCubeCount);
            case "uncured":
                city.diseaseCubeCount.set(diseaseType, diseaseCubeCount - count);
                this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) - count);
            default:
        }
        if (city.diseaseCubeCount.get(diseaseType) === 0) {
            city.diseases.delete(diseaseType);
        }
        if (this.disaseCubeCountOf(diseaseType) === 0) {
            this.eradicateDisease(diseaseType);
        }
    }
    cureDisease(diseaseType) {
        if (!(this.stateOf(diseaseType) === "uncured")) {
            throw new Error(`Cannot cure disease. ${diseaseType} is already cured.`);
        }
        this.setStateOf(diseaseType, "cured");
    }
    outbreakAt(city, diseaseType) {
        const neighbours = this.cityNetwork.getNeighbouringCities(city);
        this.outbreakedCities.add(city);
        for (const neighbour of neighbours) {
            this.infect(neighbour, diseaseType, 1);
        }
        this.outbreakedCities.clear();
        this.outbreaks++;
    }
    infect(city, diseaseType, count = 1) {
        if (this.stateOf(diseaseType) === "eradicated") {
            return;
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
        this.internalGlobalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) + count);
    }
}
exports.DiseaseManager = DiseaseManager;
