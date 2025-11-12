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

  // ----- Photo memories -----
  const memories = [
    // 2023 - Jerusalem (slightly different coordinates for each photo)
    { coords: [35.235, 31.776], photo: 'jerusalem.jpg', caption: 'Mount of Olives 1', year: 2023 },
    { coords: [35.2345, 31.7755], photo: 'jerusalem.jpg', caption: 'Western Wall', year: 2023 },
    { coords: [35.236, 31.777], photo: 'jerusalem.jpg', caption: 'Old City Street', year: 2023 },
    
    // 2022 - London
    { coords: [-0.1276, 51.5072], photo: 'london.jpg', caption: 'Rainy London 1', year: 2022 },
    { coords: [-0.128, 51.5075], photo: 'london.jpg', caption: 'Tower Bridge', year: 2022 },
    { coords: [-0.1265, 51.5065], photo: 'london.jpg', caption: 'Big Ben', year: 2022 }
    ];


  // ----- Create fullscreen modal -----
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
  modal.style.display = 'none';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = 10000;
  const modalImg = document.createElement('img');
  modalImg.style.maxWidth = '95%';
  modalImg.style.maxHeight = '95%';
  modal.appendChild(modalImg);
  document.body.appendChild(modal);

  // ----- Flyover variables -----
  let currentFlyover = null;
  let filteredMemories = [];
  let i = 0;
  let paused = false;

  function startFlyover(selectedYear) {
    filteredMemories = memories.filter(m => m.year === selectedYear);
    if (filteredMemories.length === 0) return;

    i = 0;
    paused = false;

    if (currentFlyover) clearTimeout(currentFlyover);

    function flyToNext() {
      if (paused) return;

      const m = filteredMemories[i];

      // Always fly for smooth animation
      map.flyTo({
        center: m.coords,
        zoom: 14,
        pitch: 60,
        bearing: Math.random() * 360,
        speed: 0.4,
        curve: 1.4,
        essential: true
      });

      // Remove old popups
      document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());

      // Show popup
      const imgHtml = `<img src="${m.photo}" style="width:400px;border-radius:10px;cursor:pointer;">`;
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
        .setLngLat(m.coords)
        .setHTML(`<div style="text-align:center;">${imgHtml}<p>${m.caption} (${m.year})</p></div>`)
        .addTo(map);

      // Click image to fullscreen & pause
      const img = popup.getElement().querySelector('img');
      img.addEventListener('click', () => {
        paused = true;
        modalImg.src = m.photo;
        modal.style.display = 'flex';
      });

      // Schedule next fly
      i = (i + 1) % filteredMemories.length;
      currentFlyover = setTimeout(flyToNext, 8000);
    }

    flyToNext();
  }

  // ----- Close modal & resume flyover -----
  modal.addEventListener('click', () => {
    modal.style.display = 'none';
    paused = false;
    // Resume from current photo
    startFlyover(filteredMemories[i].year);
  });

  // ----- Add Year Buttons (styled) -----
  const years = [...new Set(memories.map(m => m.year))].sort((a, b) => a - b); // oldest -> newest
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = '10px';
  buttonContainer.style.left = '50%';
  buttonContainer.style.transform = 'translateX(-50%)';
  buttonContainer.style.zIndex = 1;
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.padding = '6px 10px';
  buttonContainer.style.background = 'white';
  buttonContainer.style.borderRadius = '8px';
  buttonContainer.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  document.body.appendChild(buttonContainer);

  let selectedYearBtn = null;

  years.forEach(y => {
    const btn = document.createElement('button');
    btn.textContent = y;
    btn.style.padding = '6px 12px';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.background = 'transparent';
    btn.style.transition = '0.2s';
    btn.style.fontWeight = 'bold';
    btn.style.color = '#333';

    btn.addEventListener('mouseover', () => btn.style.background = '#f0f0f0');
    btn.addEventListener('mouseout', () => {
      if (btn !== selectedYearBtn) btn.style.background = 'transparent';
    });

    btn.onclick = () => {
      startFlyover(y);

      // Highlight selected year
      if (selectedYearBtn) {
        selectedYearBtn.style.background = 'transparent';
        selectedYearBtn.style.color = '#333';
      }
      btn.style.background = '#007bff';
      btn.style.color = 'white';
      selectedYearBtn = btn;
    };

    buttonContainer.appendChild(btn);
  });

  // Automatically select the first year
  const firstBtn = buttonContainer.querySelector('button');
  firstBtn.click();
});
