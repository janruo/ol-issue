import "ol/ol.css";

import { Map, View } from "ol";
import { default as WMTS, optionsFromCapabilities } from "ol/source/WMTS";

import ImageCanvasSource from "ol/source/ImageCanvas";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

proj4.defs("EPSG:2392", "+proj=tmerc +lat_0=0 +lon_0=24 +k=1 +x_0=2500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs");
register(proj4);

const map = new Map({
    target: "map",
    view: new View({
        center: [2776029.80, 8437870.58],
        zoom: 15,
        projection: "EPSG:3857"
    }),
});

async function createLayers(tryProjs) {
    const response = await fetch("https://julkinen.vayla.fi/rasteripalvelu/wmts?REQUEST=GetCapabilities");
    const text = await response.text();
    const reader = new WMTSCapabilities();
    const caps = reader.read(text);

    for (const tryProj of tryProjs) {
        try {
            console.log("Creating WMTS layer with proj " + tryProj);
            const wmtsLayer = new TileLayer({
                source: new WMTS(optionsFromCapabilities(caps, {
                    layer: "liikennevirasto:Rannikkokartat public",
                    projection: tryProj
                })),
                opacity: 0.5
            });
            map.addLayer(wmtsLayer);
            console.log("Success");
            break;
        } catch {
            console.log("Failed");
        }
    }

    const drawingLayer = new ImageLayer({
        source: new ImageCanvasSource({
            projection: "EPSG:2392",
            canvasFunction: drawRectangle()
        })
    });
    map.addLayer(drawingLayer);
}

function drawRectangle() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    function coordToCanvas(coord, extent, size) {
        return [
            (coord[0] - extent[0]) / (extent[2] - extent[0]) * size[0],
            (coord[1] - extent[3]) / (extent[1] - extent[3]) * size[1]
        ];
    }

    function moveTo(coord, extent, size) {
        const point = coordToCanvas(coord, extent, size);
        context.moveTo(point[0], point[1]);
    }

    function lineTo(coord, extent, size) {
        const point = coordToCanvas(coord, extent, size);
        context.lineTo(point[0], point[1]);
    }

    return function (extent, resolution, pixelRatio, size) {
        console.log("Drawing rect...", extent, resolution, pixelRatio, size);

        canvas.width = size[0];
        canvas.height = size[1];
        context.fillStyle = "red";
        context.strokeStyle = "green";
        context.lineWidth = 5;
        context.beginPath();
        moveTo([2552219.89, 6673615.31], extent, size);
        lineTo([2552219.89, 6673715.31], extent, size);
        lineTo([2552319.89, 6673715.31], extent, size);
        lineTo([2552319.89, 6673615.31], extent, size);
        context.closePath();
        context.fill();
        context.stroke();
        return canvas;
    }
}


// Fails
// createLayers(["EPSG:2392", "EPSG:3857"]);

// Works
createLayers(["EPSG:3857"]);