// ─────────────────────────────────────────────────────────────
// APP 1 — GIMNASIO (Estudiante 1)
// Registra al peleador, permite elegir su gimnasio en un mapa
// interactivo y lanza un Intent nativo hacia la App 2 (Auspiciantes).
// UI portada del diseño brutalista de mm-fight (Next.js).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text,
  StyleSheet, Alert, StatusBar,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_900Black,
} from "@expo-google-fonts/inter";
import FightMap from "./src/FightMap";
import { gimnasios, categorias, estilos, niveles } from "./src/data";
import { colors, font } from "./src/theme";
import { HardCard, Button, Chip, SectionHeading, Field, SkewBadge } from "./src/ui";
import { sendToNextApp, SCHEMES } from "./src/flow";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular, Inter_400Regular, Inter_500Medium,
    Inter_600SemiBold, Inter_700Bold, Inter_900Black,
  });

  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [categoria, setCategoria] = useState("Ligero");
  const [estilo, setEstilo] = useState("Mixto");
  const [nivel, setNivel] = useState("Amateur");
  const [gymId, setGymId] = useState(null);
  const [fly, setFly] = useState(null);

  const gym = gimnasios.find((g) => g.id === gymId);

  const markers = useMemo(
    () =>
      gimnasios.map((g) => ({
        id: g.id,
        lat: g.lat,
        lng: g.lng,
        title: g.nombre,
        subtitle: `${g.ciudad} · ${g.reputacion} · ${g.peleadoresActivos} peleadores`,
        emoji: "🥊",
        color: g.id === gymId ? "#d00000" : "#ffffff10",
      })),
    [gymId]
  );

  const onMarkerPress = (id) => {
    setGymId(id);
    const g = gimnasios.find((x) => x.id === id);
    if (g) setFly({ lat: g.lat, lng: g.lng, zoom: 13 });
  };

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const enviar = async () => {
    if (!nombre.trim() || !apodo.trim()) {
      Alert.alert("Faltan datos", "Ingresa al menos el nombre y el apodo del peleador.");
      return;
    }
    if (!gym) {
      Alert.alert("Sin gimnasio", "Selecciona un gimnasio tocando su marcador en el mapa.");
      return;
    }
    const payload = {
      version: 1,
      peleador: {
        nombre: nombre.trim(),
        apodo: apodo.trim(),
        ciudad: ciudad.trim() || gym.ciudad,
        categoria,
        estilo,
        nivel,
      },
      gimnasio: {
        id: gym.id,
        nombre: gym.nombre,
        ciudad: gym.ciudad,
        direccion: gym.direccion,
        lat: gym.lat,
        lng: gym.lng,
      },
    };
    try {
      await sendToNextApp(SCHEMES.auspiciantes, payload);
    } catch (e) {
      Alert.alert(
        "App 2 no encontrada",
        "Instala la app de Auspiciantes (mmfightsponsor://) para continuar el flujo.\n\n" + e.message
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
        <Text style={font.eyebrow}>APP 1 · MÓDULO GIMNASIO</Text>
        <Text style={font.h1}>REGISTRO{"\n"}DE PELEADOR</Text>

        <HardCard style={{ marginTop: 20 }}>
          <SectionHeading>Datos del peleador</SectionHeading>
          <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej. Andrés Silva" />
          <Field label="Apodo" value={apodo} onChangeText={setApodo} placeholder='Ej. "La Víbora"' />
          <Field label="Ciudad" value={ciudad} onChangeText={setCiudad} placeholder="Ej. Guayaquil" />

          <Text style={font.label}>Categoría</Text>
          <View style={styles.chipRow}>
            {categorias.map((c) => (
              <Chip key={c} label={c} active={categoria === c} onPress={() => setCategoria(c)} />
            ))}
          </View>

          <Text style={[font.label, { marginTop: 14 }]}>Estilo</Text>
          <View style={styles.chipRow}>
            {estilos.map((e) => (
              <Chip key={e} label={e} active={estilo === e} onPress={() => setEstilo(e)} />
            ))}
          </View>

          <Text style={[font.label, { marginTop: 14 }]}>Nivel</Text>
          <View style={styles.chipRow}>
            {niveles.map((n) => (
              <Chip key={n} label={n} active={nivel === n} onPress={() => setNivel(n)} />
            ))}
          </View>
        </HardCard>

        <View style={{ marginTop: 24 }}>
          <SectionHeading>Elige tu gimnasio</SectionHeading>
          <Text style={styles.hint}>Toca un marcador 🥊 del mapa</Text>
        </View>
        <FightMap
          markers={markers}
          selectedId={gymId}
          onMarkerPress={onMarkerPress}
          flyTo={fly}
          style={{ height: 340, marginTop: 8 }}
        />

        {gym && (
          <HardCard style={{ marginTop: 20 }} accent>
            <SkewBadge label={gym.nombre} />
            <Text style={styles.gymInfo}>{gym.direccion}</Text>
            <Text style={styles.gymInfo}>
              ⭐ {gym.reputacion} · {gym.peleadoresActivos} peleadores activos
            </Text>
            <Text style={[styles.gymInfo, { fontStyle: "italic", color: colors.textSecondary }]}>
              “{gym.tagline}”
            </Text>
            <Text style={styles.coords}>📍 {gym.lat.toFixed(4)}, {gym.lng.toFixed(4)}</Text>
          </HardCard>
        )}

        <Button
          title="Enviar a auspiciantes ➜"
          onPress={enviar}
          style={{ marginTop: 26, marginBottom: 6 }}
        />
        <Text style={styles.footNote}>Se lanza un Intent Android hacia App 2</Text>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hint: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  gymInfo: { fontFamily: "Inter_500Medium", color: colors.text, marginTop: 8, fontSize: 13 },
  coords: { fontFamily: "Inter_600SemiBold", color: colors.textMuted, marginTop: 8, fontSize: 11 },
  footNote: { fontFamily: "Inter_500Medium", color: colors.textMuted, fontSize: 11, textAlign: "center" },
});
