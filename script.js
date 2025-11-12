// ======== Memories in Motion ========
// Replace with your Mapbox access token:
mapboxgl.accessToken = 'pk.eyJ1IjoibmF0aGFuMTIzMzIxIiwiYSI6ImNtaHdha3M3aTAwa2EyaXF2emMzNXppeHAifQ.huVmBRTtNeNStubIFhWIXw';

// Create the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11', // non-satellite
  center: [0, 20], // initial position
  zoom: 1.5,
  pitch: 60,
  bearing: -45
});

// Add zoom/rotate controls
map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {
  // ----- Add terrain -----
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

  // ----- Add 3D buildings -----
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
          'interpolate',
          ['linear'],
          ['zoom'],
          15, 0,
          15.05, ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15, 0,
          15.05, ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );

  // ----- Photo memories -----
  const memories = [
    {
      city: 'Jerusalem',
      coords: [35.235, 31.776],
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

  // ----- Automatic flyover (no markers) -----
  let i = 0;

  function flyToNext() {
    const m = memories[i];

    // Fly to this memory’s coordinates
    map.flyTo({
      center: m.coords,
      zoom: 14,
      pitch: 60,
      bearing: Math.random() * 360,
      speed: 0.6,
      curve: 1.4,
      essential: true
    });

    // Remove any existing popup and show this one after 4s
    setTimeout(() => {
      document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());
      new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
        .setLngLat(m.coords)
        .setHTML(`
          <div style="text-align:center;">
            <img src="${m.photo}" style="width:200px;border-radius:10px;">
            <p>${m.caption}</p>
          </div>
        `)
        .addTo(map);
    }, 4000);

    // Next memory
    i = (i + 1) % memories.length;
    setTimeout(flyToNext, 8000); // Move to next memory after 8s
  }

  setTimeout(flyToNext, 2000); // Start after 2s
});
