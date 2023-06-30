"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityNetwork = exports.City = void 0;
const fs_1 = __importDefault(require("fs"));
const Graph_1 = require("./Graph");
class City {
    constructor(name, hasResearchStation = false) {
        this.name = name;
        this.hasResearchStation = hasResearchStation;
        this.diseases = new Set();
        this.diseaseCubeCount = new Map([
            ["red", 0],
            ["yellow", 0],
            ["blue", 0],
            ["black", 0],
        ]);
    }
    get isInfected() {
        return this.diseases.size > 0;
    }
    isInfectedWith(diseaseType) {
        return this.diseases.has(diseaseType);
    }
}
exports.City = City;
class CityNetwork {
    constructor() {
        this.graph = new Graph_1.Graph();
    }
    static buildFromFile(path) {
        const jsonData = fs_1.default.readFileSync(path, "utf-8");
        const data = JSON.parse(jsonData);
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
    addCity(city) {
        if (!this.graph.hasVertex(city)) {
            this.graph.addVertex(city);
        }
    }
    addNeighbour(city, neighbourCity) {
        this.graph.addEdge(city, neighbourCity);
    }
    get researchStations() {
        return this.graph.findVerticesWith("hasResearchStation", true);
    }
    get researchStationsPlaced() {
        return this.researchStations.length;
    }
    get cities() {
        return this.graph.vertices;
    }
    areCitiesNeighbours(city1, city2) {
        const tempCity1 = typeof city1 === "string" ? this.getCityByName(city1) : city1;
        const tempCity2 = typeof city2 === "string" ? this.getCityByName(city2) : city2;
        return this.graph.areNeighbours(tempCity1, tempCity2);
    }
    getCityByName(name) {
        const city = this.graph.vertices.find((city) => city.name === name);
        if (city === undefined) {
            throw new Error("Could not find city. Error loading city config");
        }
        return city;
    }
    getNeighbouringCities(city) {
        const tempCity = typeof city === "string" ? this.getCityByName(city) : city;
        return this.graph.getNeighbours(tempCity);
    }
    *[Symbol.iterator]() {
        yield* this.graph.vertices;
    }
}
exports.CityNetwork = CityNetwork;
