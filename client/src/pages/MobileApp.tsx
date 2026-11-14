import {
  BatteryCharging,
  Check,
  ChevronDown,
  CircleHelp,
  Headphones,
  Lock,
  Menu,
  Mic2,
  MoreHorizontal,
  Music2,
  Radio,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type MobileChannel = {
  id: number;
  name: string;
  detail: string;
  level: number;
  pan: number;
  muted: boolean;
  color: string;
  icon: "mic" | "music";
};

type MixSnapshot = {
  revision: number;
  master: number;
  globalMute: boolean;
  channels: MobileChannel[];
};

const initialChannels: MobileChannel[] = [
  {
    id: 1,
    name: "Vocal principal",
    detail: "Voz",
    level: 78,
    pan: 0,
    muted: false,
    color: "coral",
    icon: "mic",
  },
  {
    id: 2,
    name: "Vocal 2",
    detail: "Voz",
    level: 58,
    pan: -8,
    muted: false,
    color: "violet",
    icon: "mic",
  },
  {
    id: 3,
    name: "Guitarra",
    detail: "Banda",
    level: 64,
    pan: -28,
    muted: false,
    color: "amber",
    icon: "music",
  },
  {
    id: 4,
    name: "Baixo",
    detail: "Banda",
    level: 54,
    pan: 16,
    muted: false,
    color: "blue",
    icon: "music",
  },
  {
    id: 5,
    name: "Bumbo",
    detail: "Bateria",
    level: 48,
    pan: 0,
    muted: false,
    color: "orange",
    icon: "music",
  },
  {
    id: 6,
    name: "Click",
    detail: "Guias",
    level: 32,
    pan: 0,
    muted: false,
    color: "green",
    icon: "music",
  },
];

function SignalBars({ quality }: { quality: number }) {
  return (
    <span className="mobile-signal-bars" aria-label={`${quality}% de sinal`}>
      {[0, 1, 2, 3].map(index => (
        <i key={index} className={quality > index * 25 ? "on" : ""} />
      ))}
    </span>
  );
}

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <header className="mobile-app-header">
      <button
        className="mobile-icon-button"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>
      <div className="mobile-brand-lockup">
        <span className="mobile-brand-mark">dB</span>
        <div>
          <strong>dB Studio</strong>
          <span>PERFORMANCE</span>
        </div>
      </div>
      <button
        className="mobile-icon-button"
        onClick={() => setLocation("/")}
        aria-label="Abrir servidor"
      >
        <Radio size={19} />
      </button>
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  if (!open) return null;
  return (
    <>
      <button
        className="mobile-drawer-scrim"
        onClick={onClose}
        aria-label="Fechar menu"
      />
      <aside className="mobile-drawer">
        <div className="mobile-drawer-head">
          <div className="mobile-brand-lockup">
            <span className="mobile-brand-mark">dB</span>
            <div>
              <strong>dB Studio</strong>
              <span>APP DO MÚSICO</span>
            </div>
          </div>
          <button
            className="mobile-icon-button"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
        </div>
        <button className="mobile-drawer-link active">
          <SlidersHorizontal size={17} /> Minha mixagem
        </button>
        <button
          className="mobile-drawer-link"
          onClick={() =>
            toast.info("Presets disponíveis após a conexão com o servidor")
          }
        >
          {" "}
          <Zap size={17} /> Presets
        </button>
        <button
          className="mobile-drawer-link"
          onClick={() =>
            toast.info("O modo ensaio será sincronizado pelo servidor")
          }
        >
          {" "}
          <Music2 size={17} /> Ensaio
        </button>
        <button
          className="mobile-drawer-link"
          onClick={() =>
            toast.info("Diagnóstico local aberto no painel inferior")
          }
        >
          {" "}
          <Settings2 size={17} /> Configurações
        </button>
        <div className="mobile-drawer-spacer" />
        <button className="mobile-drawer-link" onClick={() => setLocation("/")}>
          <Radio size={17} /> Servidor desktop
        </button>
        <button
          className="mobile-drawer-link"
          onClick={() =>
            toast.info("Ajuda rápida", {
              description:
                "Use fones com fio e mantenha o telefone carregado durante o show.",
            })
          }
        >
          <CircleHelp size={17} /> Ajuda
        </button>
      </aside>
    </>
  );
}

export default function MobileApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(true);
  const [master, setMaster] = useState(72);
  const [protectedVolume, setProtectedVolume] = useState(true);
  const [globalMute, setGlobalMute] = useState(false);
  const [activeTab, setActiveTab] = useState<"mix" | "diagnostic">("mix");
  const [channels, setChannels] = useState(initialChannels);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [serverCode, setServerCode] = useState("DB-4821");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [latency, setLatency] = useState(12);
  const [packetLoss, setPacketLoss] = useState(0.2);
  const [mixRevision, setMixRevision] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mix")
      .then(response => {
        if (!response.ok) throw new Error("mix");
        return response.json() as Promise<MixSnapshot>;
      })
      .then(snapshot => {
        if (cancelled) return;
        setMixRevision(snapshot.revision);
        setMaster(snapshot.master);
        setGlobalMute(snapshot.globalMute);
        setChannels(snapshot.channels);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLatency(value =>
        Math.max(9, Math.min(18, value + (Math.random() > 0.5 ? 1 : -1)))
      );
      setPacketLoss(value =>
        Math.max(
          0,
          Math.min(
            1.8,
            Number((value + (Math.random() - 0.5) * 0.3).toFixed(1))
          )
        )
      );
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  const activeChannels = useMemo(
    () => channels.filter(channel => !channel.muted).length,
    [channels]
  );
  const updateChannel = async (id: number, patch: Partial<MobileChannel>) => {
    const response = await fetch(`/api/mix/channels/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ ...patch, revision: mixRevision }),
    });
    if (!response.ok) throw new Error("channel update");
    const snapshot = (await response.json()) as MixSnapshot;
    setMixRevision(snapshot.revision);
    setChannels(snapshot.channels);
  };

  const toggleMute = (id: number) => {
    const channel = channels.find(item => item.id === id);
    if (!channel) return;
    setChannels(current =>
      current.map(item =>
        item.id === id ? { ...item, muted: !item.muted } : item
      )
    );
    void updateChannel(id, { muted: !channel.muted }).catch(() =>
      toast.error("Não foi possível salvar o mute no servidor")
    );
  };

  const updateLevel = (id: number, level: number) => {
    setChannels(current =>
      current.map(channel =>
        channel.id === id ? { ...channel, level } : channel
      )
    );
    void updateChannel(id, { level }).catch(() =>
      toast.error("Não foi possível salvar o fader no servidor")
    );
  };

  const updateMaster = (masterValue: number) => {
    setMaster(masterValue);
    void fetch("/api/mix/master", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ master: masterValue, revision: mixRevision }),
    })
      .then(response => {
        if (!response.ok) throw new Error("master update");
        return response.json() as Promise<MixSnapshot>;
      })
      .then(snapshot => setMixRevision(snapshot.revision))
      .catch(() => toast.error("Não foi possível salvar o master no servidor"));
  };

  const updateGlobalMute = (muted: boolean) => {
    setGlobalMute(muted);
    void fetch("/api/mix/global-mute", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ globalMute: muted, revision: mixRevision }),
    })
      .then(response => {
        if (!response.ok) throw new Error("mute update");
        return response.json() as Promise<MixSnapshot>;
      })
      .then(snapshot => setMixRevision(snapshot.revision))
      .catch(() => toast.error("Não foi possível salvar o mute global"));
  };

  const connect = async () => {
    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          deviceId: "web-mobile",
        }),
      });
      const login = (await loginResponse.json()) as { token?: string; error?: string };
      if (!loginResponse.ok || !login.token) throw new Error(login.error ?? "login recusado");
      const response = await fetch("/api/udp/join", {
        method: "POST",
        headers: { Authorization: `Bearer ${login.token}` },
        body: JSON.stringify({ joinCode: serverCode }),
      });
      if (!response.ok) throw new Error("servidor não aceitou o dispositivo");
      setAuthToken(login.token);
      setConnected(true);
      setAuthError(null);
      toast.success("Servidor encontrado", {
        description: `${serverCode} · dispositivo autenticado na rede local.`,
      });
    } catch (error) {
      setConnected(false);
      setAuthError(error instanceof Error ? error.message : "não foi possível entrar");
      toast.error("Servidor não encontrado", {
        description: "Confira usuário, senha e a rede local.",
      });
    }
  };

  if (!authToken) {
    return (
      <div className="mobile-app-shell">
        <MobileHeader onMenu={() => setMenuOpen(true)} />
        <main className="mobile-app-main">
          <section className="mobile-connection-card mobile-login-card">
            <div className="mobile-status-label"><Lock size={14} /> ACESSO AUTORIZADO PELO DESKTOP</div>
            <h1>Entrar na mixagem</h1>
            <p>Use o usuário e a senha criados pelo técnico para este dispositivo.</p>
            <input value={username} onChange={event => setUsername(event.target.value)} placeholder="Usuário do músico" autoCapitalize="none" />
            <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Senha" type="password" />
            {authError && <span className="mobile-auth-error">{authError}</span>}
            <button className="mobile-primary-button" onClick={() => void connect()} disabled={!username || !password}>Entrar e conectar</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="mobile-app-shell">
      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="mobile-app-main">
        <section className="mobile-connection-card">
          <div className="mobile-connection-topline">
            <div className="mobile-status-label">
              <span
                className={`mobile-status-dot ${connected ? "good" : "danger"}`}
              />{" "}
              {connected ? "CONECTADO AO SERVIDOR" : "SERVIDOR OFFLINE"}
            </div>
            <button className="mobile-ghost-button" onClick={connect}>
              <RefreshCw size={14} /> Reconectar
            </button>
          </div>
          <div className="mobile-server-row">
            <div className="mobile-server-avatar">
              <Headphones size={22} />
            </div>
            <div className="mobile-server-info">
              <strong>Neon Chapel · Palco A</strong>
              <span>
                <Wifi size={13} /> Rede dB Studio · 5 GHz · {latency} ms
              </span>
            </div>
            <SignalBars quality={connected ? 88 : 12} />
          </div>
          {!connected && (
            <div className="mobile-code-row">
              <input
                value={serverCode}
                onChange={event =>
                  setServerCode(event.target.value.toUpperCase())
                }
                aria-label="Código do servidor"
              />
              <button className="mobile-primary-button" onClick={connect}>
                Conectar
              </button>
            </div>
          )}
        </section>

        <div className="mobile-page-title">
          <div>
            <span className="mobile-kicker">
              <Radio size={13} /> MIX 01 · RAFA
            </span>
            <h1>Minha mixagem</h1>
            <p>Controle apenas o que você precisa ouvir.</p>
          </div>
          <button
            className={`mobile-mode-toggle ${performanceMode ? "active" : ""}`}
            onClick={() => setPerformanceMode(value => !value)}
          >
            <Zap size={16} /> {performanceMode ? "Performance" : "Normal"}
          </button>
        </div>

        <section className="mobile-master-card">
          <div className="mobile-master-heading">
            <div>
              <span className="mobile-kicker">MASTER ESTÉREO</span>
              <strong>
                {master - 100 > -1 ? "+" : ""}
                {master - 100} dB
              </strong>
            </div>
            <button
              className={`mobile-lock-button ${protectedVolume ? "active" : ""}`}
              onClick={() => setProtectedVolume(value => !value)}
            >
              <Lock size={14} /> Proteção
            </button>
          </div>
          <div className="mobile-master-meter">
            <div className="mobile-stereo-meter">
              <span style={{ height: `${Math.max(8, master - 4)}%` }} />
              <span style={{ height: `${Math.max(8, master - 10)}%` }} />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={master}
              onChange={event => updateMaster(Number(event.target.value))}
              aria-label="Volume master"
            />
            <div className="mobile-master-scale">
              <span>-∞</span>
              <span>-12</span>
              <span>-6</span>
              <span>0 dB</span>
            </div>
          </div>
          <div className="mobile-master-actions">
            <span>
              <BatteryCharging size={15} /> 78%
            </span>
            <span>
              <Wifi size={15} /> {latency} ms
            </span>
            <button
              className={globalMute ? "danger" : ""}
              onClick={() => updateGlobalMute(!globalMute)}
            >
              {globalMute ? "MUDO GLOBAL ATIVO" : "MUTE GLOBAL"}
            </button>
          </div>
        </section>

        <div className="mobile-tabs">
          <button
            className={activeTab === "mix" ? "active" : ""}
            onClick={() => setActiveTab("mix")}
          >
            Canais <span>{activeChannels}</span>
          </button>
          <button
            className={activeTab === "diagnostic" ? "active" : ""}
            onClick={() => setActiveTab("diagnostic")}
          >
            Diagnóstico
          </button>
        </div>

        {activeTab === "mix" ? (
          <section className="mobile-channel-list">
            {channels.map(channel => (
              <article
                className={`mobile-channel-card ${channel.muted || globalMute ? "muted" : ""}`}
                key={channel.id}
              >
                <div className="mobile-channel-head">
                  <button
                    className={`mobile-channel-icon ${channel.color}`}
                    onClick={() => setSelectedChannel(channel.id)}
                    aria-label={`Abrir detalhes de ${channel.name}`}
                  >
                    {channel.icon === "mic" ? (
                      <Mic2 size={18} />
                    ) : (
                      <Music2 size={18} />
                    )}
                  </button>
                  <div className="mobile-channel-title">
                    <strong>{channel.name}</strong>
                    <span>
                      {channel.detail} ·{" "}
                      {channel.pan === 0
                        ? "Centro"
                        : channel.pan < 0
                          ? `L ${Math.abs(channel.pan)}`
                          : `R ${channel.pan}`}
                    </span>
                  </div>
                  <button
                    className={`mobile-mute-button ${channel.muted ? "active" : ""}`}
                    onClick={() => toggleMute(channel.id)}
                  >
                    {channel.muted ? "MUDO" : "MUTE"}
                  </button>
                  <button
                    className="mobile-more-button"
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <MoreHorizontal size={17} />
                  </button>
                </div>
                <div className="mobile-channel-control">
                  <div className="mobile-channel-meter">
                    <span
                      style={{ height: `${Math.max(12, channel.level - 15)}%` }}
                    />
                    <span
                      style={{ height: `${Math.max(10, channel.level - 28)}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={channel.level}
                    onChange={event =>
                      updateLevel(channel.id, Number(event.target.value))
                    }
                    aria-label={`Volume ${channel.name}`}
                  />
                  <strong>
                    {channel.level - 100 > -1 ? "+" : ""}
                    {channel.level - 100} dB
                  </strong>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mobile-diagnostic-panel">
            <div className="mobile-diagnostic-hero">
              <div className="mobile-diagnostic-icon">
                <Check size={21} />
              </div>
              <div>
                <span className="mobile-kicker">TRANSPORTE DE ÁUDIO</span>
                <h2>Rota estável</h2>
                <p>
                  O cliente web está usando a ponte de Preview. O cliente nativo
                  usará o mesmo contrato por UDP.
                </p>
              </div>
            </div>
            <div className="mobile-diagnostic-grid">
              <div>
                <span>LATÊNCIA</span>
                <strong>
                  {latency} <small>ms</small>
                </strong>
              </div>
              <div>
                <span>PERDA</span>
                <strong>
                  {packetLoss.toFixed(1)} <small>%</small>
                </strong>
              </div>
              <div>
                <span>BUFFER</span>
                <strong>
                  96 <small>frames</small>
                </strong>
              </div>
              <div>
                <span>SAMPLE RATE</span>
                <strong>
                  48 <small>kHz</small>
                </strong>
              </div>
            </div>
            <div className="mobile-diagnostic-note">
              <Wifi size={16} />
              <p>
                Para palco: computador no Ethernet CAT6, roteador 5 GHz dedicado
                e fones com fio. Bluetooth não é recomendado para monitoramento
                crítico.
              </p>
            </div>
          </section>
        )}

        <div className="mobile-bottom-actions">
          <button
            onClick={() =>
              toast.info("Favoritos filtrados", {
                description: "Os canais favoritos estão em destaque nesta mix.",
              })
            }
          >
            <Check size={16} /> Favoritos
          </button>
          <button
            onClick={() =>
              toast.info("Ajuda rápida", {
                description:
                  "Toque no ícone do canal para abrir EQ e processamento.",
              })
            }
          >
            <CircleHelp size={16} /> Ajuda
          </button>
        </div>
      </main>

      {selectedChannel !== null && (
        <div
          className="mobile-sheet-scrim"
          onClick={() => setSelectedChannel(null)}
        >
          <section
            className="mobile-channel-sheet"
            onClick={event => event.stopPropagation()}
          >
            <div className="mobile-sheet-grab" />
            <div className="mobile-sheet-head">
              <div>
                <span className="mobile-kicker">
                  CANAL {String(selectedChannel).padStart(2, "0")}
                </span>
                <h2>
                  {
                    channels.find(channel => channel.id === selectedChannel)
                      ?.name
                  }
                </h2>
              </div>
              <button
                className="mobile-icon-button"
                onClick={() => setSelectedChannel(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-sheet-tabs">
              <button className="active">EQ</button>
              <button>Compressor</button>
              <button>Efeitos</button>
            </div>
            <div className="mobile-eq-curve">
              <i />
              <i />
              <i />
              <i />
              <svg viewBox="0 0 360 100" preserveAspectRatio="none">
                <path d="M0 75 C 55 73, 82 66, 112 65 S 154 51, 190 58 S 235 43, 270 46 S 315 30, 360 24" />
              </svg>
            </div>
            <div className="mobile-band-grid">
              {["LOW", "LOW MID", "HIGH MID", "HIGH"].map((label, index) => (
                <label key={label}>
                  <span>{label}</span>
                  <strong>
                    {["+1.5", "-0.8", "+2.2", "+1.0"][index]} <small>dB</small>
                  </strong>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={[58, 44, 68, 63][index]}
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
            <button
              className="mobile-primary-button wide"
              onClick={() => {
                setSelectedChannel(null);
                toast.success("Ajustes enviados", {
                  description:
                    "O servidor aplicará o processamento na próxima troca de bloco.",
                });
              }}
            >
              <Check size={16} /> Aplicar ao servidor
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
