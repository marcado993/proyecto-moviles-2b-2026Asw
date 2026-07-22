// ─────────────────────────────────────────────────────────────
// APP 2 — AUSPICIANTES (Estudiante 2)
// Recibe al peleador vía Intent (mmfightsponsor://flow?payload=...),
// muestra empresas auspiciantes en un mapa, firma el patrocinio y
// lanza un Intent nativo hacia la App 3 (Tinder de Peleas).
// UI portada del diseño brutalista de mm-fight (Next.js).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Alert, StatusBar,
} from "react-native";
import { useURL } from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_900Black,
} from "@expo-google-fonts/inter";
import FightMap from "./src/FightMap";
import { auspiciantes } from "./src/data";
import { colors, font } from "./src/theme";
import { HardCard, Button, SectionHeading, Badge, SkewBadge } from "./src/ui";
import { parsePayloadFromUrl, sendToNextApp, SCHEMES } from "./src/flow";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular, Inter_400Regular, Inter_500Medium,
    Inter_600SemiBold, Inter_700Bold, Inter_900Black,
  });

  const url = useURL();
  const [payload, setPayload] = useState({ version: 1 });
  const [sponsorId, setSponsorId] = useState(null);
  const [fly, setFly] = useState(null);

  useEffect(() => {
    const p = parsePayloadFromUrl(url);
    if (p) setPayload(p);
  }, [url]);

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  const markers = useMemo(
    () =>
      auspiciantes.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        title: s.nombre,
        subtitle: `${s.industria} · $${s.montoUSD.toLocaleString()} USD`,
        emoji: "💰",
        color: s.id === sponsorId ? "#d00000" : "#ffffff10",
      })),
    [sponsorId]
  );

  if (!fontsLoaded && !fontError) return null;

  const sponsor = auspiciantes.find((s) => s.id === sponsorId);
  const peleador = payload.peleador;

  const onMarkerPress = (id) => {
    setSponsorId(id);
    const s = auspiciantes.find((x) => x.id === id);
    if (s) setFly({ lat: s.lat, lng: s.lng, zoom: 13 });
  };

  const enviar = async () => {
    if (!sponsor) {
      Alert.alert("Sin auspiciante", "Selecciona una empresa tocando su marcador en el mapa.");
      return;
    }
    const next = {
      ...payload,
      auspiciante: {
        id: sponsor.id,
        nombre: sponsor.nombre,
        industria: sponsor.industria,
        montoUSD: sponsor.montoUSD,
        lat: sponsor.lat,
        lng: sponsor.lng,
      },
    };
    try {
      await sendToNextApp(SCHEMES.tinder, next);
    } catch (e) {
      Alert.alert(
        "App 3 no encontrada",
        "Instala la app Tinder de Peleas (mmfightmatch://) para continuar el flujo.\n\n" + e.message
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} onLayout={onLayout}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}><Text style={styles.logoTx}>EC</Text></View>
          <Text style={styles.brand}>MMA <Text style={{ color: colors.primary }}>ECUADOR</Text></Text>
        </View>
        <Text style={font.eyebrow}>APP 2 · MÓDULO AUSPICIANTES</Text>
        <Text style={font.h1}>PATROCINIO{"\n"}DEL PELEADOR</Text>

        <HardCard style={{ marginTop: 20 }} accent={!!peleador}>
          {peleador ? (
            <>
              <Badge label="Recibido vía Intent" tone="success" />
              <Text style={styles.recvBig}>
                {peleador.nombre} “{peleador.apodo}”
              </Text>
              <Text style={styles.recvInfo}>
                {peleador.categoria} · {peleador.estilo} · {peleador.nivel}
              </Text>
              {payload.gimnasio && (
                <Text style={styles.recvInfo}>🥊 {payload.gimnasio.nombre} — {payload.gimnasio.ciudad}</Text>
              )}
            </>
          ) : (
            <>
              <Badge label="Sin datos de App 1" tone="outline" />
              <Text style={styles.recvInfo}>
                Esta app espera un Intent de la App Gimnasio. Puedes continuar en modo
                demo; el contrato se completa con lo disponible.
              </Text>
            </>
          )}
        </HardCard>

        <View style={{ marginTop: 24 }}>
          <SectionHeading>Elige el auspiciante</SectionHeading>
          <Text style={styles.hint}>Toca un marcador 💰 del mapa</Text>
        </View>
        <FightMap
          markers={markers}
          selectedId={sponsorId}
          onMarkerPress={onMarkerPress}
          flyTo={fly}
          style={{ height: 340, marginTop: 8 }}
        />

        {sponsor && (
          <HardCard style={{ marginTop: 20 }} accent>
            <SkewBadge label={sponsor.nombre} />
            <Text style={styles.recvInfo}>{sponsor.industria} · {sponsor.ciudad}</Text>
            <Text style={styles.recvInfo}>{sponsor.descripcion}</Text>
            <Text style={styles.monto}>${sponsor.montoUSD.toLocaleString()} USD</Text>
            <Text style={styles.coords}>📍 {sponsor.lat.toFixed(4)}, {sponsor.lng.toFixed(4)}</Text>
          </HardCard>
        )}

        <Button
          title="Firmar y buscar rival ➜"
          onPress={enviar}
          style={{ marginTop: 26, marginBottom: 6 }}
        />
        <Text style={styles.footNote}>Se lanza un Intent Android hacia App 3</Text>
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
  recvBig: { fontFamily: "Anton_400Regular", color: colors.text, fontSize: 20, marginTop: 10, textTransform: "uppercase" },
  recvInfo: { fontFamily: "Inter_500Medium", color: colors.text, marginTop: 8, fontSize: 13 },
  monto: { fontFamily: "Anton_400Regular", color: colors.green, fontSize: 22, marginTop: 12 },
  coords: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, marginTop: 8, fontSize: 11 },
  footNote: { fontFamily: "Inter_500Medium", color: colors.textMuted, fontSize: 11, textAlign: "center" },
});
