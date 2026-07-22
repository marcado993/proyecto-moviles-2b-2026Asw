# App 1 — Gimnasio (Estudiante 1)

Registro del peleador + mapa interactivo de gimnasios de Ecuador
(OpenStreetMap/Leaflet, marcadores personalizados 🥊).

- **Scheme Android:** `mmfightgym://`
- **Envía Intent a:** App 2 Auspiciantes (`mmfightsponsor://flow?payload=...`)
- **Escribe en el contrato:** `peleador`, `gimnasio` (ver `../CONTRATO-DATOS.md`)

## Ejecutar

```bash
npm install
npx expo start          # desarrollo (Expo Go: el mapa y la UI funcionan)
npx expo run:android    # build nativo (necesario para probar Intents entre apps)
```

## Demo del examen (individual)

1. Llena el formulario del peleador (nombre, apodo, categoría, estilo, nivel).
2. Toca un marcador 🥊 en el mapa para elegir gimnasio (el mapa hace flyTo y
   resalta el marcador en dorado).
3. "ENVIAR A AUSPICIANTES" lanza el Intent `ACTION_VIEW` con el payload JSON.
