// ─────────────────────────────────────────────────────────────
// APP 3 — TINDER DE PELEAS (Estudiante 3)
// Recibe peleador + gimnasio + auspiciante vía Intent
// (mmfightmatch://flow?payload=...), permite hacer swipe entre
// rivales, agenda la pelea eligiendo venue y fecha en el mapa, y
// lanza un Intent nativo hacia la App 4 (Tienda).
// UI portada del diseño brutalista de mm-fight (Next.js).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Alert, StatusBar, Animated, PanResponder, Dimensions,
} from "react-native";
import { useURL } from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_900Black,
} from "@expo-google-fonts/inter";
import FightMap from "./src/FightMap";
import { rivales, venues, fechasPropuestas } from "./src/data";
import { colors, font } from "./src/theme";
import { HardCard, Button, Chip, SectionHeading, Badge, StatBlock } from "./src/ui";
import { parsePayloadFromUrl, sendToNextApp, SCHEMES } from "./src/flow";

SplashScreen.preventAutoHideAsync().catch(() => {});

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_UMBRAL = SCREEN_W * 0.3;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular, Inter_400Regular, Inter_500Medium,
    Inter_600SemiBold, Inter_700Bold, Inter_900Black,
  });

  const url = useURL();
  const [payload, setPayload] = useState({ version: 1 });
  const [idx, setIdx] = useState(0);
  const [match, setMatch] = useState(null);
  const [venueId, setVenueId] = useState(null);
  const [fecha, setFecha] = useState(fechasPropuestas[0]);
  const [fly, setFly] = useState(null);

  useEffect(() => {
    const p = parsePayloadFromUrl(url);
    if (p) setPayload(p);
  }, [url]);

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  const cola = useMemo(() => {
    const cat = payload.peleador?.categoria;
    if (!cat) return rivales;
    return [...rivales].sort((a, b) =>
      (b.categoria === cat ? 1 : 0) - (a.categoria === cat ? 1 : 0)
    );
  }, [payload.peleador?.categoria]);

  const rival = cola[idx % cola.length];
  const venue = venues.find((v) => v.id === venueId);

  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ["-18deg", "0deg", "18deg"],
  });

  const decidir = (aceptado) => {
    Animated.timing(pan, {
      toValue: { x: aceptado ? SCREEN_W * 1.2 : -SCREEN_W * 1.2, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      if (aceptado) setMatch(cola[idx % cola.length]);
      else setIdx((i) => i + 1);
    });
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_UMBRAL) decidir(true);
        else if (g.dx < -SWIPE_UMBRAL) decidir(false);
        else
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
      },
    })
  ).current;

  const markers = useMemo(
    () =>
      venues.map((v) => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        title: v.nombre,
        subtitle: `${v.ciudad} · Capacidad ${v.capacidad.toLocaleString()}`,
        emoji: "🏟️",
        color: v.id === venueId ? "#d00000" : "#ffffff10",
      })),
    [venueId]
  );

  const onMarkerPress = (id) => {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    if (v) setFly({ lat: v.lat, lng: v.lng, zoom: 14 });
  };

  if (!fontsLoaded && !fontError) return null;

  const enviar = async () => {
    if (!match) return;
    if (!venue) {
      Alert.alert("Sin venue", "Selecciona el escenario de la pelea en el mapa.");
      return;
    }
    const next = {
      ...payload,
      pelea: {
        rivalNombre: match.nombre,
        rivalApodo: match.apodo,
        rivalGimnasio: match.gimnasio,
        categoria: match.categoria,
        fecha,
        venueNombre: venue.nombre,
        venueLat: venue.lat,
        venueLng: venue.lng,
      },
    };
    try {
      await sendToNextApp(SCHEMES.tienda, next);
    } catch (e) {
      Alert.alert(
        "App 4 no encontrada",
        "Instala la app Tienda (mmfightstore://) para cerrar el flujo.\n\n" + e.message
      );
    }
  };

  const peleador = payload.peleador;

  return (
    <SafeAreaView style={styles.safe} onLayout={onLayout}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}><Text style={styles.logoTx}>EC</Text></View>
          <Text style={styles.brand}>MMA <Text style={{ color: colors.primary }}>ECUADOR</Text></Text>
        </View>
        <Text style={font.eyebrow}>APP 3 · MÓDULO MATCHMAKING</Text>
        <Text style={font.h1}>TINDER{"\n"}DE PELEAS</Text>

        <HardCard style={{ marginTop: 18 }} accent={!!peleador}>
          {peleador ? (
            <Text style={styles.recvInfo}>
              📥 {peleador.nombre} “{peleador.apodo}” ({peleador.categoria}) busca rival
              {payload.auspiciante
                ? ` · 💰 ${payload.auspiciante.nombre} ($${payload.auspiciante.montoUSD.toLocaleString()})`
                : ""}
            </Text>
          ) : (
            <Text style={styles.recvInfo}>
              ⚠️ Sin Intent de la App 2 — modo demo: desliza para elegir rival.
            </Text>
          )}
        </HardCard>

        {!match ? (
          <>
            <View style={{ marginTop: 22 }}>
              <SectionHeading>Desliza para decidir</SectionHeading>
              <Text style={styles.hint}>➜ derecha acepta el reto · ⬅ izquierda pasa</Text>
            </View>
            <View style={styles.deck}>
              <Animated.View
                {...responder.panHandlers}
                style={[
                  styles.fightCard,
                  { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
                ]}
              >
                <Text style={styles.cardEmoji}>{rival.emoji}</Text>
                <Text style={styles.cardName}>
                  {rival.nombre}{"\n"}“{rival.apodo}”
                </Text>
                <Text style={styles.cardSub}>{rival.gimnasio} · {rival.ciudad}</Text>
                <View style={styles.badgeRow}>
                  <Badge label={rival.categoria} tone="red" />
                  <Badge label={rival.estilo} tone="outline" />
                  <Badge label={rival.nivel} tone="dark" />
                </View>
                <Text style={styles.recordTx}>Récord {rival.record}</Text>
                <View style={styles.statRow}>
                  <StatBlock label="Poder" value={rival.poder} color={colors.primary} />
                  <StatBlock label="Grap." value={rival.grappling} color={colors.blue} />
                  <StatBlock label="Cardio" value={rival.cardio} color={colors.orange} />
                </View>
              </Animated.View>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.round, styles.no]} onPress={() => decidir(false)}>
                <Text style={styles.roundTx}>✖</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.round, styles.yes]} onPress={() => decidir(true)}>
                <Text style={styles.roundTx}>🔥</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <HardCard style={{ marginTop: 22 }} accent>
              <Text style={styles.matchTx}>🔥 ¡MATCH DE PELEA!</Text>
              <Text style={styles.cardName}>
                {peleador ? `${peleador.apodo} vs ` : ""}“{match.apodo}”
              </Text>
              <Text style={styles.cardSub}>{match.nombre} · {match.gimnasio} · {match.categoria}</Text>
              <TouchableOpacity onPress={() => { setMatch(null); setIdx((i) => i + 1); }}>
                <Text style={styles.link}>↩ Elegir otro rival</Text>
              </TouchableOpacity>
            </HardCard>

            <View style={{ marginTop: 22 }}>
              <SectionHeading>Elige el escenario</SectionHeading>
              <Text style={styles.hint}>Toca un marcador 🏟️ del mapa</Text>
            </View>
            <FightMap
              markers={markers}
              selectedId={venueId}
              onMarkerPress={onMarkerPress}
              flyTo={fly}
              center={[-1.55, -78.9]}
              zoom={6.4}
              style={{ height: 300, marginTop: 8 }}
            />

            <Text style={[font.label, { marginTop: 18 }]}>Fecha propuesta</Text>
            <View style={styles.chipRow}>
              {fechasPropuestas.map((f) => (
                <Chip key={f} label={f} active={fecha === f} onPress={() => setFecha(f)} />
              ))}
            </View>

            {venue && (
              <HardCard style={{ marginTop: 18 }}>
                <Text style={styles.venueName}>🏟️ {venue.nombre}</Text>
                <Text style={styles.recvInfo}>{venue.ciudad} · Capacidad {venue.capacidad.toLocaleString()}</Text>
                <Text style={styles.coords}>📍 {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}</Text>
              </HardCard>
            )}

            <Button
              title="Agendar y comprar kit ➜"
              onPress={enviar}
              style={{ marginTop: 26, marginBottom: 6 }}
            />
            <Text style={styles.footNote}>Se lanza un Intent Android hacia App 4</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 56 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  logoBox: { width: 30, height: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoTx: { color: colors.white, fontFamily: "Anton_400Regular", fontSize: 13 },
  brand: { fontFamily: "Anton_400Regular", fontSize: 15, color: colors.text, letterSpacing: 1 },
  hint: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  recvInfo: { fontFamily: "Inter_500Medium", color: colors.text, fontSize: 13 },
  deck: { alignItems: "center", marginTop: 10 },
  fightCard: {
    width: "100%",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 3,
    borderColor: colors.primary,
    padding: 22,
    alignItems: "center",
  },
  cardEmoji: { fontSize: 52 },
  cardName: {
    fontFamily: "Anton_400Regular", color: colors.text, fontSize: 22,
    marginTop: 10, textAlign: "center", textTransform: "uppercase",
  },
  cardSub: { fontFamily: "Inter_500Medium", color: colors.textSecondary, marginTop: 4, textAlign: "center", fontSize: 13 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  recordTx: { fontFamily: "Inter_700Bold", color: colors.textMuted, marginTop: 10, fontSize: 12 },
  statRow: { flexDirection: "row", gap: 8, marginTop: 16, alignSelf: "stretch" },
  btnRow: { flexDirection: "row", justifyContent: "center", gap: 32, marginTop: 20 },
  round: {
    width: 64, height: 64, alignItems: "center", justifyContent: "center", borderWidth: 3,
  },
  no: { borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  yes: { borderColor: colors.primary, backgroundColor: colors.red900 },
  roundTx: { fontSize: 26, color: colors.white },
  matchTx: { fontFamily: "Anton_400Regular", color: colors.primary, fontSize: 17, letterSpacing: 1 },
  link: { fontFamily: "Inter_700Bold", color: colors.text, marginTop: 12, textDecorationLine: "underline" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  venueName: { fontFamily: "Anton_400Regular", color: colors.text, fontSize: 17, textTransform: "uppercase" },
  coords: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, marginTop: 8, fontSize: 11 },
  footNote: { fontFamily: "Inter_500Medium", color: colors.textMuted, fontSize: 11, textAlign: "center" },
});
