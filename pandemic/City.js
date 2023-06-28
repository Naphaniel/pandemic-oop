"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityNetwork = exports.City = void 0;
const fs_1 = __importDefault(require("fs"));
const Graph_1 = require("./Graph");
class City {
    get isInfected() {
        return this.diseaseType !== "none" && this.diseaseCubeCount > 0;
    }
    constructor(name, hasResearchStation = false) {
        this.name = name;
        this.hasResearchStation = hasResearchStation;
        this.diseaseType = "none";
        this.diseaseCubeCount = 0;
    }
    buildResearchStation() {
        this.hasResearchStation = true;
    }
    removeResearchStation() {
        this.hasResearchStation = false;
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
            cityNetwork.graph.addVertex(city);
            for (const neighbour of cityData.neighbours) {
                const neighbourCity = new City(neighbour);
                if (!cityNetwork.graph.hasVertex(neighbourCity)) {
                    cityNetwork.graph.addVertex(neighbourCity);
                }
                cityNetwork.graph.addEdge(city, neighbourCity);
            }
        }
        return cityNetwork;
    }
    get researchStations() {
        return this.graph.findVerticesWith("hasResearchStation", true);
    }
    areCitiesNeighbours(city1, city2) {
        const tempCity1 = typeof city1 === "string" ? this.getCityByName(city1) : city1;
        const tempCity2 = typeof city2 === "string" ? this.getCityByName(city2) : city2;
        return this.graph.areNeighbours(tempCity1, tempCity2);
    }
    getCityByName(name) {
        {
            const city = this.graph.vertices.find((city) => city.name === name);
            if (city === undefined) {
                throw new Error("Could not find city. Error loading city config");
            }
            return city;
        }
    }
    getNeighbouringCities(city) {
        const tempCity = typeof city === "string" ? this.getCityByName(city) : city;
        return this.graph.getNeighbours(tempCity);
    }
    *[Symbol.iterator]() {
        for (const city of this.graph) {
            yield city;
        }
    }
}
exports.CityNetwork = CityNetwork;
