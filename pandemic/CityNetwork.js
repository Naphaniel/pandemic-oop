"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityNetwork = void 0;
const fs_1 = __importDefault(require("fs"));
const Graph_1 = require("./Graph");
class City {
    constructor(name, infected = false, researchStation = false) {
        this.name = name;
        this.infected = infected;
        this.researchStation = researchStation;
    }
}
class CityNetwork {
    constructor() {
        this.graph = new Graph_1.Graph();
    }
    getCityByName(name) {
        return this.graph.vertices.find((city) => city.name === name);
    }
    getNeighbouringCities(city) {
        return this.graph.getNeighbours(city);
    }
    areCitiesNeighbours(city1, city2) {
        return this.graph.areNeighbours(city1, city2);
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
    *[Symbol.iterator]() {
        for (const city of this.graph) {
            yield city;
        }
    }
}
exports.CityNetwork = CityNetwork;
