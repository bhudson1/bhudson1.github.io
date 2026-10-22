# Vancouver 3D Scenario Viewer

## Run locally

Requires Python 3 and internet access to download MapLibre JS and the OpenFreeMap basemap.

1. Unzip the project.
2. Open a terminal in the `vancouver-3d-viewer` folder.
3. Run `python -m http.server 8000` (or `py -m http.server 8000` on Windows).
4. Navigate to `http://localhost:8000` in Chrome, Firefox or Edge.

Alternatively, on Windows double-click `start_server.bat`.

## Your own ArcGIS data

Export building footprint polygons as GeoJSON in **WGS 84 (EPSG:4326)**. Replace `data/scenarios.geojson` with your export. Each feature should have:

- `height_m`: numeric building height in metres (not storeys)
- `score`: numeric score from 1 to 5 (optional; defaults to 5)
- `requires`: object listing scenario conditions, e.g. `{"A":true,"B":false}`. An unspecified option does not affect the feature.
- `name`: display name, optional
- `color`: CSS hexadecimal colour such as `#16a08c`, optional

The example dataset is **synthetic** and for UI demonstration only; it does not represent actual Vancouver development proposals.

Example feature:
```json
{"type":"Feature","properties":{"name":"Example tower","height_m":72,"score":4.2,"requires":{"A":true,"C":false},"color":"#16a08c"},"geometry":{"type":"Polygon","coordinates":[[[-123.12,49.28],[-123.119,49.28],[-123.119,49.281],[-123.12,49.281],[-123.12,49.28]]]}}
```

## Logic / scenario combination

`app.js` contains the `matches` function. As currently implemented, features are shown if all explicitly required option states match and `score >= Minimum scenario score`. The height slider multiplies displayed height globally; it does not edit the source data. Change the condition matching logic to implement your own combinatorial scenario rules.

## 3D model formats

This initial working prototype uses **2.5D GeoJSON footprint extrusion**, not uploaded GLB mesh rendering. For actual detailed 3D geometry, prefer GLB (binary glTF) or tiled 3D models; rendering those requires an additional custom 3D layer with Three.js/maplibre-gl-three or another compatible renderer. City-scale high-detail geometry generally needs **3D Tiles** rather than a single huge GLB.

## Notes

- The webpage is served from localhost but uses public internet-hosted scripts and map tiles.
- The basemap's 3D context buildings depend on its source schema and zoom level; they are not an authoritative City of Vancouver building model.
- Map controls and data are client-side only. There is no database or backend.
