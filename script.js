// ======== Memories in Motion ========
// Replace with your Mapbox access token:
mapboxgl.accessToken = 'pk.eyJ1IjoibmF0aGFuMTIzMzIxIiwiYSI6ImNtaHdha3M3aTAwa2EyaXF2emMzNXppeHAifQ.huVmBRTtNeNStubIFhWIXw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20],
  zoom: 1.5,
  pitch: 60,
  bearing: -45
});

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
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );

  // ----- Photo memories with multiple images per year -----
  const memories = [
    // Year 2023 - Jerusalem (duplicate same image to simulate multiple photos)
    { coords: [35.235, 31.776], photo: 'jerusalem.jpg', caption: 'Mount of Olives 1', year: 2023 },
    { coords: [35.435, 31.876], photo: 'jerusalem.jpg', caption: 'Mount of Olives 2', year: 2023 },
    { coords: [35.215, 31.776], photo: 'jerusalem.jpg', caption: 'Mount of Olives 3', year: 2023 },

    // Year 2022 - London (duplicate same image to simulate multiple photos)
    { coords: [-0.1576, 51.5072], photo: 'london.jpg', caption: 'Rainy London 1', year: 2022 },
    { coords: [-0.1276, 51.5172], photo: 'london.jpg', caption: 'Rainy London 2', year: 2022 },
    { coords: [-0.1476, 51.5072], photo: 'london.jpg', caption: 'Rainy London 3', year: 2022 }
  ];

  // ----- Flyover variables -----
  let currentFlyover = null;

  function startFlyover(selectedYear) {
    // Filter memories by selected year
    const filtered = memories.filter(m => m.year === selectedYear);
    if (filtered.length === 0) return;

    let i = 0;

    // Stop previous flyover
    if (currentFlyover) clearTimeout(currentFlyover);

    function flyToNext() {
      const m = filtered[i];
      map.flyTo({
        center: m.coords,
        zoom: 14,
        pitch: 60,
        bearing: Math.random() * 360,
        speed: 0.6,
        curve: 1.4,
        essential: true
      });

      // Remove old popups
      document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());

      // Add new popup
      new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
        .setLngLat(m.coords)
        .setHTML(`<div style="text-align:center;">
                    <img src="${m.photo}" style="width:200px;border-radius:10px;">
                    <p>${m.caption} (${m.year})</p>
                  </div>`)
        .addTo(map);

      i = (i + 1) % filtered.length;
      currentFlyover = setTimeout(flyToNext, 5000); // cycle every 5 seconds
    }

    flyToNext();
  }

  // ----- Add Year Buttons -----
  const years = [...new Set(memories.map(m => m.year))];
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = '10px';
  buttonContainer.style.left = '10px';
  buttonContainer.style.zIndex = 1;
  document.body.appendChild(buttonContainer);

  years.forEach(y => {
    const btn = document.createElement('button');
    btn.textContent = y;
    btn.style.margin = '2px';
    btn.onclick = () => startFlyover(y);
    buttonContainer.appendChild(btn);
  });

  // Start flyover automatically with the first year
  startFlyover(years[0]);
});
