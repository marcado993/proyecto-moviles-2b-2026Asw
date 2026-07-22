# App 2 — Auspiciantes (Estudiante 2)

Recibe al peleador vía Intent, muestra empresas auspiciantes en el mapa
(marcadores 💰) y firma el patrocinio.

- **Scheme Android:** `mmfightsponsor://` (declarado en `app.json` → intent-filter)
- **Recibe Intent de:** App 1 Gimnasio
- **Envía Intent a:** App 3 Tinder de Peleas (`mmfightmatch://flow?payload=...`)
- **Escribe en el contrato:** `auspiciante`

## Ejecutar

```bash
npm install
npx expo run:android
```

## Probar la recepción del Intent sin la App 1

```bash
adb shell am start -a android.intent.action.VIEW -d "mmfightsponsor://flow?payload=%7B%22version%22%3A1%2C%22peleador%22%3A%7B%22nombre%22%3A%22Test%22%2C%22apodo%22%3A%22Demo%22%2C%22categoria%22%3A%22Ligero%22%2C%22estilo%22%3A%22Mixto%22%2C%22nivel%22%3A%22Amateur%22%2C%22ciudad%22%3A%22Quito%22%7D%7D"
```
