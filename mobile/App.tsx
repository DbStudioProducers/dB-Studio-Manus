import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Channel = {
  id: number;
  name: string;
  level: number;
  muted: boolean;
  color: string;
};

type MixSnapshot = {
  master: number;
  globalMute: boolean;
  channels: Channel[];
};

const initialChannels: Channel[] = [
  { id: 1, name: "Vocal principal", level: 78, muted: false, color: "#ff8e86" },
  { id: 2, name: "Vocal 2", level: 58, muted: false, color: "#b6a1ff" },
  { id: 3, name: "Guitarra", level: 64, muted: false, color: "#eec56c" },
  { id: 4, name: "Baixo", level: 54, muted: false, color: "#75b8ff" },
  { id: 5, name: "Bumbo", level: 48, muted: false, color: "#ffab74" },
  { id: 6, name: "Click", level: 32, muted: false, color: "#78e0a2" },
];

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000";

export default function App() {
  const [serverCode, setServerCode] = useState("DB-4821");
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [master, setMaster] = useState(72);
  const [globalMute, setGlobalMute] = useState(false);
  const [channels, setChannels] = useState(initialChannels);

  const activeChannels = useMemo(
    () => channels.filter(channel => !channel.muted).length,
    [channels]
  );

  const refreshStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/udp/status`);
      if (!response.ok) throw new Error("server unavailable");
      const payload = (await response.json()) as { state: string };
      setConnected(payload.state === "listening");
      setLatency(payload.state === "listening" ? 12 : null);
    } catch {
      setConnected(false);
      setLatency(null);
    }
  };

  const refreshMix = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mix`);
      if (!response.ok) throw new Error("mix unavailable");
      const snapshot = (await response.json()) as MixSnapshot;
      setMaster(snapshot.master);
      setGlobalMute(snapshot.globalMute);
      setChannels(snapshot.channels);
    } catch {
      // Mantém o último estado local se a telemetria responder antes da mixagem.
    }
  };

  useEffect(() => {
    void refreshStatus();
    void refreshMix();
  }, []);

  const toggleMute = (id: number) => {
    const channel = channels.find(item => item.id === id);
    if (!channel) return;
    const muted = !channel.muted;
    setChannels(current =>
      current.map(channel =>
        channel.id === id ? { ...channel, muted } : channel
      )
    );
    void fetch(`${API_BASE}/api/mix/channels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ muted }),
    }).catch(() => undefined);
  };

  const toggleGlobalMute = () => {
    const next = !globalMute;
    setGlobalMute(next);
    void fetch(`${API_BASE}/api/mix/global-mute`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalMute: next }),
    }).catch(() => undefined);
  };

  const updateMaster = (value: number) => {
    const next = Math.max(0, Math.min(100, value));
    setMaster(next);
    void fetch(`${API_BASE}/api/mix/master`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ master: next }),
    }).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>dB</Text>
          </View>
          <View>
            <Text style={styles.brand}>dB Studio</Text>
            <Text style={styles.overline}>PERFORMANCE</Text>
          </View>
          <View style={styles.headerSpacer} />
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              void refreshStatus();
              void refreshMix();
            }}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.connectionCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.overline}>
              {connected ? "CONECTADO AO SERVIDOR" : "SERVIDOR OFFLINE"}
            </Text>
            <Text
              style={[styles.status, connected ? styles.good : styles.danger]}
            >
              {connected ? "● online" : "● offline"}
            </Text>
          </View>
          <Text style={styles.serverTitle}>Neon Chapel · Palco A</Text>
          <Text style={styles.mutedText}>
            Rede local · 5 GHz · {latency ? `${latency} ms` : "sem resposta"}
          </Text>
          {!connected && (
            <View style={styles.connectRow}>
              <TextInput
                value={serverCode}
                onChangeText={value => setServerCode(value.toUpperCase())}
                style={styles.codeInput}
                placeholder="Código"
                placeholderTextColor="#718580"
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  void refreshStatus();
                  void refreshMix();
                }}
              >
                <Text style={styles.primaryText}>Conectar</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.overline}>MIX 01 · RAFA</Text>
            <Text style={styles.title}>Minha mixagem</Text>
            <Text style={styles.mutedText}>
              Controle apenas o que você precisa ouvir.
            </Text>
          </View>
          <View style={styles.livePill}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.masterCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.overline}>MASTER ESTÉREO</Text>
              <Text style={styles.masterValue}>{master - 100} dB</Text>
            </View>
            <Pressable style={styles.protection}>
              <Text style={styles.protectionText}>▣ Proteção</Text>
            </Pressable>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>-∞</Text>
            <Pressable
              style={styles.headerButton}
              onPress={() => updateMaster(master - 5)}
              accessibilityLabel="Diminuir master"
            >
              <Text style={styles.headerButtonText}>−</Text>
            </Pressable>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${master}%` }]} />
              <View
                style={[
                  styles.sliderKnob,
                  { left: `${Math.max(0, master - 3)}%` },
                ]}
              />
            </View>
            <Pressable
              style={styles.headerButton}
              onPress={() => updateMaster(master + 5)}
              accessibilityLabel="Aumentar master"
            >
              <Text style={styles.headerButtonText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.mutedText}>◉ 78% bateria</Text>
            <Text style={styles.mutedText}>⌁ {latency ?? "--"} ms</Text>
            <Pressable onPress={toggleGlobalMute}>
              <Text style={[styles.muteText, globalMute && styles.danger]}>
                {globalMute ? "MUDO ATIVO" : "MUTE GLOBAL"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Canais <Text style={styles.count}>{activeChannels}</Text>
          </Text>
          <Text style={styles.mutedText}>Diagnóstico</Text>
        </View>
        {channels.map(channel => (
          <View
            style={[
              styles.channelCard,
              (channel.muted || globalMute) && styles.dimmed,
            ]}
            key={channel.id}
          >
            <View style={styles.channelTop}>
              <View
                style={[styles.channelIcon, { backgroundColor: channel.color }]}
              >
                <Text style={styles.channelIconText}>♪</Text>
              </View>
              <View style={styles.channelName}>
                <Text style={styles.channelTitle}>{channel.name}</Text>
                <Text style={styles.mutedText}>Estéreo · Centro</Text>
              </View>
              <Pressable
                style={[styles.muteButton, channel.muted && styles.muteActive]}
                onPress={() => toggleMute(channel.id)}
              >
                <Text style={styles.muteButtonText}>
                  {channel.muted ? "MUDO" : "MUTE"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.levelRow}>
              <Text style={styles.meter}>▮▮</Text>
              <View style={styles.sliderTrack}>
                <View
                  style={[styles.sliderFill, { width: `${channel.level}%` }]}
                />
                <View
                  style={[
                    styles.sliderKnob,
                    { left: `${Math.max(0, channel.level - 3)}%` },
                  ]}
                />
              </View>
              <Text style={styles.dbValue}>{channel.level - 100} dB</Text>
            </View>
          </View>
        ))}

        <View style={styles.footerNote}>
          <Text style={styles.mutedText}>
            DBAU/1 ·{" "}
            {connected
              ? "ponte local ativa"
              : "conecte ao servidor para telemetria"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080d10" },
  content: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1f3031",
    marginBottom: 16,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "#5cf2c2",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  brandMarkText: { color: "#5cf2c2", fontWeight: "900", fontSize: 12 },
  brand: { color: "#edf4f1", fontWeight: "800", fontSize: 14 },
  overline: {
    color: "#77918a",
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "800",
  },
  headerSpacer: { flex: 1 },
  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#29413d",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: { color: "#5cf2c2", fontSize: 20 },
  connectionCard: {
    backgroundColor: "#10191c",
    borderColor: "#1f3031",
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: { fontSize: 10 },
  good: { color: "#5cf2c2" },
  danger: { color: "#ff6f78" },
  serverTitle: {
    color: "#edf4f1",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 4,
  },
  mutedText: { color: "#829690", fontSize: 11 },
  connectRow: { flexDirection: "row", gap: 8, marginTop: 13 },
  codeInput: {
    flex: 1,
    color: "#edf4f1",
    backgroundColor: "#0b1315",
    borderWidth: 1,
    borderColor: "#2a4042",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: "#5cf2c2",
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  primaryText: { color: "#07110e", fontWeight: "900", fontSize: 11 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  title: {
    color: "#edf4f1",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -1,
  },
  livePill: {
    borderWidth: 1,
    borderColor: "#326e5e",
    borderRadius: 7,
    padding: 8,
  },
  liveText: { color: "#5cf2c2", fontSize: 9, fontWeight: "900" },
  masterCard: {
    backgroundColor: "#10191c",
    borderColor: "#1f3031",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  masterValue: {
    color: "#edf4f1",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },
  protection: {
    borderWidth: 1,
    borderColor: "#326e5e",
    borderRadius: 8,
    padding: 8,
  },
  protectionText: { color: "#5cf2c2", fontSize: 10, fontWeight: "800" },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  sliderValue: { color: "#60736e", fontSize: 10 },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 5,
    backgroundColor: "#42504f",
    position: "relative",
  },
  sliderFill: { height: 6, backgroundColor: "#5cf2c2", borderRadius: 5 },
  sliderKnob: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#5cf2c2",
  },
  muteText: { color: "#a5b6b1", fontSize: 9, fontWeight: "800" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#203033",
  },
  sectionTitle: { color: "#edf4f1", fontSize: 13, fontWeight: "900" },
  count: { color: "#5cf2c2", backgroundColor: "#183a33", paddingHorizontal: 5 },
  channelCard: {
    backgroundColor: "#10191c",
    borderColor: "#1f3031",
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginTop: 9,
  },
  dimmed: { opacity: 0.58 },
  channelTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  channelIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  channelIconText: { color: "#08110f", fontSize: 19, fontWeight: "900" },
  channelName: { flex: 1 },
  channelTitle: {
    color: "#edf4f1",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  muteButton: {
    borderWidth: 1,
    borderColor: "#2a3d3e",
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 7,
  },
  muteActive: { borderColor: "#7a3c43", backgroundColor: "#351b20" },
  muteButtonText: { color: "#8da09b", fontSize: 9, fontWeight: "900" },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 13,
    paddingLeft: 46,
  },
  meter: { color: "#5cf2c2", fontSize: 10 },
  dbValue: { width: 45, color: "#bdccc7", fontSize: 10, textAlign: "right" },
  footerNote: { alignItems: "center", paddingTop: 18 },
});
