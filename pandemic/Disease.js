"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiseaseManager = void 0;
class DiseaseManager {
    constructor() {
        this.internalDiseaseStates = new Map([
            ["red", "uncured"],
            ["yellow", "uncured"],
            ["blue", "uncured"],
            ["black", "uncured"],
        ]);
        this.internalDiseaseCubeCounts = new Map([
            ["red", 0],
            ["yellow", 0],
            ["blue", 0],
            ["black", 0],
        ]);
        this.outbreaks = 0;
        this.infectionRate = 0;
    }
    get diseaseStates() {
        return this.internalDiseaseStates;
    }
    get diseaseCubeCounts() {
        return this.internalDiseaseCubeCounts;
    }
    eradicateDisease(diseaseType) {
        this.setStateOf(diseaseType, "eradicated");
    }
    disaseCubeCountOf(diseaseType) {
        return this.diseaseCubeCounts.get(diseaseType) ?? 0;
    }
    stateOf(diseaseType) {
        return this.internalDiseaseStates.get(diseaseType) ?? "uncured";
    }
    setStateOf(diseaseType, state) {
        this.internalDiseaseStates.set(diseaseType, state);
    }
    treatDiseaseAt(city, count = 1) {
        if (!city.isInfected) {
            throw new Error(`Cannot treat disease. ${city.name} is not infected`);
        }
        const { diseaseType, diseaseCubeCount } = city;
        const diseaseState = this.stateOf(diseaseType);
        switch (diseaseState) {
            case "eradicated":
                if (diseaseState === "eradicated") {
                    throw new Error(`Cannot treat disease. ${diseaseType} is already eradiacted.`);
                }
            case "cured":
                city.diseaseCubeCount = 0;
                this.internalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) - diseaseCubeCount);
            case "uncured":
                city.diseaseCubeCount -= count;
                this.internalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) - count);
            default:
        }
        if (city.diseaseCubeCount === 0) {
            city.diseaseType = "none";
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
    infect(city, diseaseType, count = 1) {
        city.diseaseType = diseaseType;
        city.diseaseCubeCount += count;
        this.internalDiseaseCubeCounts.set(diseaseType, this.disaseCubeCountOf(diseaseType) + count);
    }
}
exports.DiseaseManager = DiseaseManager;
