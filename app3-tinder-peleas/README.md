# App 3 — Tinder de Peleas (Estudiante 3)

Swipe de rivales (PanResponder + Animated, sin librerías externas), match de
pelea, selección de venue 🏟️ y fecha en el mapa.

- **Scheme Android:** `mmfightmatch://`
- **Recibe Intent de:** App 2 Auspiciantes
- **Envía Intent a:** App 4 Tienda (`mmfightstore://flow?payload=...`)
- **Escribe en el contrato:** `pelea`

## Ejecutar

```bash
npm install
npx expo run:android
```

## Demo

1. Desliza la carta a la derecha (o 🔥) para aceptar el reto, izquierda (✖) para pasar.
2. Al hacer match, elige el escenario en el mapa y una fecha.
3. "AGENDAR Y COMPRAR KIT" lanza el Intent hacia la App 4.

Los rivales de la misma categoría del peleador recibido aparecen primero.
