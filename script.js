mapboxgl.accessToken = 'pk.eyJ1IjoibmF0aGFuMTIzMzIxIiwiYSI6ImNtaHdha3M3aTAwa2EyaXF2emMzNXppeHAifQ.huVmBRTtNeNStubIFhWIXw'; // paste your token here

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20], // starting position [lng, lat]
  zoom: 1.5,
  pitch: 60,
  bearing: -45
});

// Add zoom and rotation controls
map.addControl(new mapboxgl.NavigationControl());

// Add 3D terrain once map loads
map.on('load', () => {
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  // Add 3D buildings
const layers = map.getStyle().layers;
const labelLayerId = layers.find(
  (layer) => layer.type === 'symbol' && layer.layout['text-field']
).id;

map.addLayer(
  {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.6
    }
  },
  labelLayerId
);
// Example photo memory
const memories = [
  {
    city: 'Jerusalem',
    coords: [35.235, 31.776], // [lng, lat]
    photo: 'jerusalem.jpg',
    caption: 'Mount of Olives, 2023'
  },
  {
    city: 'London',
    coords: [-0.1276, 51.5072],
    photo: 'london.jpg',
    caption: 'A rainy afternoon in London'
  }
];

// Loop through each memory and add a popup
memories.forEach(m => {
  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <div style="text-align:center;">
      <img src="${m.photo}" style="width:200px;border-radius:10px;">
      <p>${m.caption}</p>
    </div>
  `);

  // Add a marker (optional — can remove for clean look)
  new mapboxgl.Marker({ color: '#ff4d4d' })
    .setLngLat(m.coords)
    .setPopup(popup)
    .addTo(map);
});

});


