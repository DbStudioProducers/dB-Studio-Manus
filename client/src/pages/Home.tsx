import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  FileAudio,
  FileText,
  Headphones,
  Heart,
  Info,
  Laptop2,
  LayoutDashboard,
  Library,
  Lock,
  Menu,
  Mic2,
  MoreHorizontal,
  Music2,
  Network,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Speaker,
  SquarePen,
  Tablet,
  Timer,
  Upload,
  UserRound,
  UsersRound,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type View =
  | "dashboard"
  | "mixer"
  | "devices"
  | "mixes"
  | "presets"
  | "rehearsal"
  | "reports"
  | "settings";
type Channel = {
  id: number;
  name: string;
  type: string;
  icon: string;
  color: string;
  level: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  favorite: boolean;
  meter: number[];
  group: string;
};

type Device = {
  name: string;
  role: string;
  model: string;
  battery: number;
  latency: number;
  signal: number;
  status: "Estável" | "Atenção" | "Conectando";
  color: string;
  initials: string;
};

const channelsSeed: Channel[] = [
  {
    id: 1,
    name: "Vocal principal",
    type: "Vocal",
    icon: "mic",
    color: "coral",
    level: 78,
    pan: 0,
    mute: false,
    solo: false,
    favorite: true,
    meter: [35, 48, 60, 53, 68, 72, 61],
    group: "Vozes",
  },
  {
    id: 2,
    name: "Vocal 2",
    type: "Vocal",
    icon: "mic",
    color: "violet",
    level: 58,
    pan: -8,
    mute: false,
    solo: false,
    favorite: true,
    meter: [22, 36, 40, 45, 52, 42, 49],
    group: "Vozes",
  },
  {
    id: 3,
    name: "Guitarra",
    type: "Guitarra",
    icon: "guitar",
    color: "amber",
    level: 64,
    pan: -28,
    mute: false,
    solo: false,
    favorite: true,
    meter: [27, 35, 48, 43, 57, 50, 55],
    group: "Banda",
  },
  {
    id: 4,
    name: "Baixo",
    type: "Baixo",
    icon: "bass",
    color: "blue",
    level: 54,
    pan: 16,
    mute: false,
    solo: false,
    favorite: false,
    meter: [33, 39, 44, 50, 46, 51, 42],
    group: "Banda",
  },
  {
    id: 5,
    name: "Bumbo",
    type: "Bateria",
    icon: "drums",
    color: "orange",
    level: 48,
    pan: 0,
    mute: false,
    solo: false,
    favorite: false,
    meter: [38, 48, 58, 46, 39, 51, 43],
    group: "Bateria",
  },
  {
    id: 6,
    name: "Caixa",
    type: "Bateria",
    icon: "drums",
    color: "pink",
    level: 43,
    pan: 12,
    mute: false,
    solo: false,
    favorite: false,
    meter: [28, 40, 50, 37, 46, 58, 47],
    group: "Bateria",
  },
  {
    id: 7,
    name: "Teclado",
    type: "Teclas",
    icon: "keys",
    color: "cyan",
    level: 39,
    pan: 30,
    mute: false,
    solo: false,
    favorite: false,
    meter: [24, 33, 37, 46, 42, 37, 40],
    group: "Banda",
  },
  {
    id: 8,
    name: "Click",
    type: "Click",
    icon: "click",
    color: "green",
    level: 32,
    pan: 0,
    mute: false,
    solo: false,
    favorite: true,
    meter: [21, 27, 35, 25, 31, 34, 30],
    group: "Guias",
  },
];

const devicesSeed: Device[] = [
  {
    name: "Rafa · Vocal",
    role: "Mix 01",
    model: "iPhone 15 Pro",
    battery: 92,
    latency: 8,
    signal: 94,
    status: "Estável",
    color: "coral",
    initials: "R",
  },
  {
    name: "Bia · Guitarra",
    role: "Mix 02",
    model: "Pixel 8",
    battery: 78,
    latency: 11,
    signal: 88,
    status: "Estável",
    color: "amber",
    initials: "B",
  },
  {
    name: "Caio · Baixo",
    role: "Mix 03",
    model: "Galaxy S24",
    battery: 63,
    latency: 14,
    signal: 76,
    status: "Atenção",
    color: "violet",
    initials: "C",
  },
  {
    name: "Lia · Teclas",
    role: "Mix 04",
    model: "iPad mini",
    battery: 86,
    latency: 9,
    signal: 91,
    status: "Estável",
    color: "cyan",
    initials: "L",
  },
  {
    name: "Nando · Bateria",
    role: "Mix 05",
    model: "iPhone 13",
    battery: 41,
    latency: 18,
    signal: 62,
    status: "Atenção",
    color: "pink",
    initials: "N",
  },
];

const nav = [
  { id: "dashboard" as View, label: "Visão geral", icon: LayoutDashboard },
  { id: "mixer" as View, label: "Mixer pessoal", icon: SlidersHorizontal },
  {
    id: "devices" as View,
    label: "Band devices",
    icon: UsersRound,
    badge: "5",
  },
  { id: "mixes" as View, label: "Mixes bank", icon: Library },
  { id: "presets" as View, label: "Presets", icon: Sparkles },
];

const utilityNav = [
  { id: "rehearsal" as View, label: "Modo ensaio", icon: Music2 },
  { id: "reports" as View, label: "Relatórios", icon: FileText },
  { id: "settings" as View, label: "Configurações", icon: Settings2 },
];

const viewLabels: Record<View, string> = {
  dashboard: "Visão geral",
  mixer: "Mixer pessoal",
  devices: "Band devices",
  mixes: "Mixes bank",
  presets: "Presets",
  rehearsal: "Modo ensaio",
  reports: "Relatórios",
  settings: "Configurações",
};

function getInitialView(path: string): View {
  const clean = path.replace("/", "") as View;
  return clean && viewLabels[clean] ? clean : "dashboard";
}

function MiniMeter({
  bars = 7,
  active = 5,
  warm = false,
}: {
  bars?: number;
  active?: number;
  warm?: boolean;
}) {
  return (
    <span className="mini-meter" aria-label="medidor de nível">
      {Array.from({ length: bars }).map((_, index) => (
        <i
          key={index}
          className={`${index < active ? "on" : ""} ${warm && index > bars - 3 ? "warm" : ""}`}
        />
      ))}
    </span>
  );
}

function StatusDot({
  tone = "good",
}: {
  tone?: "good" | "warn" | "danger" | "muted";
}) {
  return <span className={`status-dot ${tone}`} aria-hidden="true" />;
}

function SectionTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-action" onClick={onAction}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

function MeterBars({
  values,
  accent = "aqua",
}: {
  values: number[];
  accent?: string;
}) {
  return (
    <div className={`meter-bars ${accent}`}>
      {values.map((value, index) => (
        <span key={index} style={{ height: `${Math.max(8, value)}%` }} />
      ))}
    </div>
  );
}

function Avatar({
  device,
  size = "md",
}: {
  device: Device;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={`avatar ${size} ${device.color}`}>{device.initials}</div>
  );
}

function AppShell({
  view,
  onView,
  children,
  sessionSaved,
  onSave,
}: {
  view: View;
  onView: (view: View) => void;
  children: React.ReactNode;
  sessionSaved: boolean;
  onSave: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setLocation] = useLocation();
  const go = (next: View) => {
    onView(next);
    setMobileOpen(false);
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <span>d</span>
            <i />
          </div>
          <div>
            <strong>dB</strong>
            <em>STUDIO</em>
          </div>
          <button className="close-mobile" onClick={() => setMobileOpen(false)}>
            <X size={17} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-icon">
            <Radio size={15} />
          </span>
          <div>
            <span>Workspace</span>
            <strong>
              Neon Chapel <ChevronDown size={13} />
            </strong>
          </div>
          <span className="live-pill">LIVE</span>
        </div>
        <nav className="nav-group">
          <span className="nav-label">CONTROLE</span>
          {nav.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => go(item.id)}
            >
              <item.icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </button>
          ))}
        </nav>
        <nav className="nav-group utility">
          <span className="nav-label">OPERAÇÃO</span>
          {utilityNav.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => go(item.id)}
            >
              <item.icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-card">
            <div className="connection-top">
              <span>
                <StatusDot /> Rede local
              </span>
              <strong>5 GHz</strong>
            </div>
            <div className="connection-line">
              <span style={{ width: "84%" }} />
            </div>
            <small>
              <Wifi size={12} /> 84% · 8 dispositivos permitidos
            </small>
          </div>
          <button className="help-link">
            <CircleHelp size={16} /> Ajuda rápida <span>⌘ /</span>
          </button>
          <div className="user-card">
            <div className="user-avatar">MS</div>
            <div>
              <strong>Henrique Corrêa</strong>
              <span>Sound engineer</span>
            </div>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
              <Menu size={21} />
            </button>
            <div className="crumb">
              <span>Neon Chapel</span>
              <ChevronRight size={14} />
              <strong>{viewLabels[view]}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="performer-link"
              onClick={() => setLocation("/mobile")}
              title="Abrir app do músico"
            >
              <Smartphone size={15} /> App do músico
            </button>
            <div className="show-clock">
              <Clock3 size={14} />
              <span>Próximo show</span>
              <strong>Hoje, 20:30</strong>
            </div>
            <button className="icon-button" title="Notificações">
              <Bell size={17} />
              <i />
            </button>
            <button className="save-button" onClick={onSave}>
              {sessionSaved ? <Check size={15} /> : <Upload size={15} />}{" "}
              {sessionSaved ? "Salvo agora" : "Salvar sessão"}
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function Dashboard({
  onView,
  devices,
  selectedDevice,
  setSelectedDevice,
}: {
  onView: (view: View) => void;
  devices: Device[];
  selectedDevice: number;
  setSelectedDevice: (value: number) => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="live-kicker">
            <StatusDot /> SESSÃO AO VIVO <span>·</span> 01:42:18
          </div>
          <h1>
            Boa noite, Marina <span className="wave">⌁</span>
          </h1>
          <p>Seu palco está estável. Aqui está o pulso do seu sistema.</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => onView("rehearsal")}
          >
            <Play size={15} /> Abrir ensaio
          </button>
          <button className="primary-button" onClick={() => onView("mixer")}>
            <SlidersHorizontal size={15} /> Abrir mixer
          </button>
        </div>
      </div>
      <section className="signal-hero">
        <div className="signal-copy">
          <span className="eyebrow">SAÚDE DO SISTEMA</span>
          <div className="signal-score">
            <strong>98</strong>
            <span>/ 100</span>
            <div className="score-ring">
              <svg viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" />
                <circle className="progress" cx="21" cy="21" r="17" />
              </svg>
              <Check size={15} />
            </div>
          </div>
          <p>
            Operação dentro do ideal <StatusDot />
          </p>
          <div className="signal-meta">
            <span>
              <Activity size={14} /> Latência <strong>8 ms</strong>
            </span>
            <span>
              <Network size={14} /> Packet loss <strong>0.02%</strong>
            </span>
            <span>
              <Zap size={14} /> Buffer <strong>128 samples</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="pulse-label">
            <span>STEREO BUS</span>
            <strong>-6.2 dB</strong>
          </div>
          <MeterBars
            values={[
              28, 42, 50, 74, 61, 80, 86, 67, 74, 48, 64, 55, 78, 88, 70, 58,
              79, 66, 44, 56, 62, 73, 48, 39, 60, 67, 54, 70, 82, 63,
            ]}
          />
          <div className="hero-axis">
            <span>-24</span>
            <span>-12</span>
            <span>-6</span>
            <span>0 dB</span>
          </div>
        </div>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan">
            <Headphones size={17} />
          </div>
          <div>
            <span>MIXES ATIVAS</span>
            <strong>
              5 <small>/ 16</small>
            </strong>
            <em className="positive">
              <ArrowUpRight size={12} /> 2 nesta semana
            </em>
          </div>
          <div className="stat-spark cyan-spark">
            <span style={{ height: "35%" }} />
            <span style={{ height: "45%" }} />
            <span style={{ height: "38%" }} />
            <span style={{ height: "63%" }} />
            <span style={{ height: "56%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "72%" }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon violet">
            <Wifi size={17} />
          </div>
          <div>
            <span>QUALIDADE WI-FI</span>
            <strong>
              84<small>%</small>
            </strong>
            <em className="positive">
              <ArrowUpRight size={12} /> +4.2% hoje
            </em>
          </div>
          <div className="stat-spark violet-spark">
            <span style={{ height: "58%" }} />
            <span style={{ height: "45%" }} />
            <span style={{ height: "66%" }} />
            <span style={{ height: "61%" }} />
            <span style={{ height: "75%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "88%" }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <Timer size={17} />
          </div>
          <div>
            <span>TEMPO DE SESSÃO</span>
            <strong>
              01:42<small>:18</small>
            </strong>
            <em>Ensaio · 8 canais</em>
          </div>
          <div className="stat-spark amber-spark">
            <span style={{ height: "28%" }} />
            <span style={{ height: "50%" }} />
            <span style={{ height: "44%" }} />
            <span style={{ height: "61%" }} />
            <span style={{ height: "73%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "88%" }} />
          </div>
        </div>
      </div>
      <div className="content-grid two-one">
        <section className="panel devices-panel">
          <SectionTitle
            eyebrow="BAND DEVICES"
            title="Músicos conectados"
            action="Ver todos"
            onAction={() => onView("devices")}
          />
          <div className="table-head">
            <span>MÚSICO</span>
            <span>CONEXÃO</span>
            <span>MIX</span>
            <span>STATUS</span>
          </div>
          <div className="device-list">
            {devices.slice(0, 4).map((device, index) => (
              <button
                className={`device-row ${selectedDevice === index ? "selected" : ""}`}
                key={device.name}
                onClick={() => setSelectedDevice(index)}
              >
                <div className="device-person">
                  <Avatar device={device} />
                  <div>
                    <strong>{device.name}</strong>
                    <span>{device.model}</span>
                  </div>
                </div>
                <div className="device-connection">
                  <MiniMeter active={Math.round(device.signal / 20)} />
                  <span>{device.latency} ms</span>
                </div>
                <span className="mix-tag">{device.role}</span>
                <span
                  className={`device-status ${device.status === "Atenção" ? "warn" : ""}`}
                >
                  <StatusDot
                    tone={device.status === "Atenção" ? "warn" : "good"}
                  />{" "}
                  {device.status}
                </span>
                <ChevronRight size={15} className="row-chevron" />
              </button>
            ))}
          </div>
          <button
            className="add-device"
            onClick={() =>
              toast.success("Convite criado", {
                description: "Envie o código DB-4821 para o próximo músico.",
              })
            }
          >
            <Plus size={14} /> Convidar dispositivo
          </button>
        </section>
        <section className="panel focus-panel">
          <SectionTitle
            eyebrow="MIX EM FOCO"
            title="Rafa · Vocal"
            action="Abrir mixer"
            onAction={() => onView("mixer")}
          />
          <div className="focus-device">
            <Avatar device={devices[0]} size="lg" />
            <div>
              <strong>iPhone 15 Pro</strong>
              <span>
                <StatusDot /> Conectado há 42 min
              </span>
            </div>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="focus-meter">
            <div className="focus-meter-head">
              <span>SAÍDA ESTÉREO</span>
              <strong>-5.8 dB</strong>
            </div>
            <MeterBars
              values={[
                35, 48, 64, 58, 77, 68, 82, 75, 61, 73, 80, 60, 70, 84, 75, 60,
              ]}
            />
            <div className="stereo-label">
              <span>L</span>
              <span>R</span>
            </div>
          </div>
          <div className="focus-controls">
            <div>
              <span>MASTER</span>
              <strong>-8.0 dB</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="76"
              aria-label="Master da mix em foco"
            />
            <button className="mute-button">MUTE</button>
          </div>
          <div className="focus-footer">
            <span>
              <BatteryCharging size={14} /> 92%
            </span>
            <span>
              <Wifi size={14} /> 94%
            </span>
            <span>
              <Activity size={14} /> 8 ms
            </span>
          </div>
        </section>
      </div>
      <section className="panel alert-panel">
        <div className="alert-icon">
          <AlertTriangle size={18} />
        </div>
        <div>
          <strong>2 pontos pedem atenção</strong>
          <p>
            Nando está com 41% de bateria e o sinal da mix 03 oscilou nos
            últimos 5 minutos.
          </p>
        </div>
        <button className="text-action" onClick={() => onView("devices")}>
          Revisar agora <ChevronRight size={15} />
        </button>
      </section>
    </>
  );
}

function ChannelStrip({
  channel,
  onUpdate,
  onDetail,
}: {
  channel: Channel;
  onUpdate: (id: number, patch: Partial<Channel>) => void;
  onDetail: (channel: Channel) => void;
}) {
  const icon =
    channel.icon === "mic" ? (
      <Mic2 size={15} />
    ) : channel.icon === "guitar" || channel.icon === "bass" ? (
      <Music2 size={15} />
    ) : channel.icon === "click" ? (
      <Timer size={15} />
    ) : (
      <Speaker size={15} />
    );
  return (
    <div className={`channel-strip ${channel.mute ? "is-muted" : ""}`}>
      <div className="channel-top">
        <button
          className={`channel-icon ${channel.color}`}
          onClick={() => onDetail(channel)}
        >
          {icon}
        </button>
        <button
          className={`star-button ${channel.favorite ? "favorite" : ""}`}
          onClick={() => onUpdate(channel.id, { favorite: !channel.favorite })}
        >
          <Heart size={13} fill={channel.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="channel-name">
        <strong>{channel.name}</strong>
        <span>
          {channel.type} · {channel.group}
        </span>
      </div>
      <div className="channel-meters">
        <div className="meter-rail">
          <span
            className="meter-fill"
            style={{ height: `${channel.level}%` }}
          />
          <i style={{ bottom: `${Math.min(94, channel.level + 14)}%` }} />
        </div>
        <div className="meter-rail thin">
          <span
            className="meter-fill teal"
            style={{ height: `${Math.min(96, channel.level * 0.86)}%` }}
          />
        </div>
      </div>
      <div className="fader-area">
        <input
          type="range"
          min="0"
          max="100"
          value={channel.level}
          onChange={event =>
            onUpdate(channel.id, { level: Number(event.target.value) })
          }
          aria-label={`Volume de ${channel.name}`}
        />
        <div className="fader-scale">
          <span>+6</span>
          <span>0</span>
          <span>-12</span>
          <span>-24</span>
          <span>∞</span>
        </div>
      </div>
      <div className="channel-value">
        {channel.level - 100 > -100
          ? `${(channel.level / 5 - 20).toFixed(1)} dB`
          : "-∞"}
      </div>
      <div className="pan-control">
        <span>L</span>
        <input
          type="range"
          min="-50"
          max="50"
          value={channel.pan}
          onChange={event =>
            onUpdate(channel.id, { pan: Number(event.target.value) })
          }
          aria-label={`Pan de ${channel.name}`}
        />
        <span>R</span>
      </div>
      <div className="channel-actions">
        <button
          className={channel.mute ? "active danger" : ""}
          onClick={() => onUpdate(channel.id, { mute: !channel.mute })}
        >
          M
        </button>
        <button
          className={channel.solo ? "active solo" : ""}
          onClick={() => onUpdate(channel.id, { solo: !channel.solo })}
        >
          S
        </button>
        <button onClick={() => onDetail(channel)}>
          <SlidersHorizontal size={13} />
        </button>
      </div>
    </div>
  );
}

function Mixer({
  channels,
  onUpdate,
  onDetail,
  onView,
}: {
  channels: Channel[];
  onUpdate: (id: number, patch: Partial<Channel>) => void;
  onDetail: (channel: Channel) => void;
  onView: (view: View) => void;
}) {
  const [performance, setPerformance] = useState(false);
  const [search, setSearch] = useState("");
  const visibleChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <StatusDot /> MIX 01 · RAFA · VOCAL
          </div>
          <h1>Mixer pessoal</h1>
          <p>
            Ajustes rápidos para a mixagem de Rafa. Alterações ficam isoladas
            nesta mix.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className={`secondary-button ${performance ? "active-button" : ""}`}
            onClick={() => setPerformance(!performance)}
          >
            <Zap size={15} />{" "}
            {performance ? "Modo performance" : "Modo completo"}
          </button>
          <button
            className="primary-button"
            onClick={() =>
              toast.success("Mixagem salva", {
                description: "Mix 01 atualizada no banco local.",
              })
            }
          >
            <Check size={15} /> Salvar mix
          </button>
        </div>
      </div>
      <div className="mixer-toolbar">
        <div className="toolbar-tabs">
          <button className="active">
            Canais <span>8</span>
          </button>
          <button>
            Favoritos{" "}
            <span>{channels.filter(channel => channel.favorite).length}</span>
          </button>
          <button>
            Grupos <span>3</span>
          </button>
        </div>
        <div className="toolbar-tools">
          <label className="search-field">
            <Search size={15} />
            <input
              placeholder="Buscar canal"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>
          <button
            className="tool-button"
            onClick={() =>
              toast.info("Estrutura bloqueada", {
                description: "Desbloqueie para editar o patchbay.",
              })
            }
          >
            <Lock size={15} />
          </button>
          <button className="tool-button" onClick={() => onView("presets")}>
            <Sparkles size={15} />
          </button>
        </div>
      </div>
      <div className="mixer-stage">
        <div className="mix-source">
          <div className="mix-source-label">
            MIX <strong>01</strong>
          </div>
          <Avatar device={devicesSeed[0]} size="sm" />
          <div>
            <strong>Rafa</strong>
            <span>Vocal</span>
          </div>
          <button className="icon-button">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <div className="channel-rack">
          {visibleChannels.map(channel => (
            <ChannelStrip
              key={channel.id}
              channel={channel}
              onUpdate={onUpdate}
              onDetail={onDetail}
            />
          ))}
          <div className="master-strip">
            <div className="master-badge">
              <Radio size={16} />
            </div>
            <div className="channel-name">
              <strong>Master</strong>
              <span>Estéreo · limiter</span>
            </div>
            <div className="master-meter">
              <MeterBars
                values={[35, 54, 68, 77, 71, 84, 63, 74, 82, 68, 52, 62]}
              />
              <span>-5.8 dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="82"
              aria-label="Volume master"
            />
            <strong className="master-db">-8.0 dB</strong>
            <button className="master-mute">MUTE</button>
          </div>
        </div>
      </div>
      <div className="mixer-footer">
        <span>
          <Info size={14} /> Toque no ícone do canal para abrir EQ, compressor e
          efeitos.
        </span>
        <div>
          <button onClick={() => toast.info("Último snapshot restaurado")}>
            Desfazer
          </button>
          <button onClick={() => toast.success("Snapshot criado")}>
            Criar snapshot <Plus size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

function Devices({
  devices,
  onView,
}: {
  devices: Device[];
  onView: (view: View) => void;
}) {
  const [filter, setFilter] = useState("Todos");
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <StatusDot /> 5 CONECTADOS · 11 VAGAS
          </div>
          <h1>Band devices</h1>
          <p>Monitore e administre os receptores da banda em tempo real.</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() =>
              toast.info("Código de convite", {
                description: "DB-4821 · válido por 10 minutos",
              })
            }
          >
            <Send size={15} /> Convidar músico
          </button>
          <button
            className="primary-button"
            onClick={() =>
              toast.success("Varredura concluída", {
                description: "Nenhum dispositivo novo encontrado.",
              })
            }
          >
            <RefreshCw size={15} /> Atualizar rede
          </button>
        </div>
      </div>
      <div className="device-overview">
        <div>
          <span>CONECTADOS</span>
          <strong>
            5 <small>/ 16</small>
          </strong>
        </div>
        <div>
          <span>LATÊNCIA MÉDIA</span>
          <strong>
            11 <small>ms</small>
          </strong>
        </div>
        <div>
          <span>QUALIDADE WI-FI</span>
          <strong>
            84 <small>%</small>
          </strong>
        </div>
        <div>
          <span>ALERTAS</span>
          <strong className="warn-number">2</strong>
        </div>
        <div className="device-overview-visual">
          <MiniMeter active={7} />
          <span>Rede dB Studio · 5 GHz</span>
        </div>
      </div>
      <section className="panel full-panel">
        <div className="panel-toolbar">
          <div className="toolbar-tabs">
            <button
              className={filter === "Todos" ? "active" : ""}
              onClick={() => setFilter("Todos")}
            >
              Todos <span>5</span>
            </button>
            <button
              className={filter === "Estável" ? "active" : ""}
              onClick={() => setFilter("Estável")}
            >
              Estáveis <span>3</span>
            </button>
            <button
              className={filter === "Atenção" ? "active" : ""}
              onClick={() => setFilter("Atenção")}
            >
              Atenção <span>2</span>
            </button>
          </div>
          <button className="tool-button">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <div className="table-head devices-table">
          <span>MÚSICO / DISPOSITIVO</span>
          <span>SINAL WI-FI</span>
          <span>BATERIA</span>
          <span>LATÊNCIA</span>
          <span>MIX</span>
          <span>STATUS</span>
          <span />
        </div>
        <div className="device-list detailed">
          {devices
            .filter(device => filter === "Todos" || device.status === filter)
            .map(device => (
              <div className="device-row detailed-row" key={device.name}>
                <div className="device-person">
                  <Avatar device={device} />
                  <div>
                    <strong>{device.name}</strong>
                    <span>{device.model}</span>
                  </div>
                </div>
                <div className="signal-cell">
                  <MiniMeter
                    active={Math.max(3, Math.round(device.signal / 20))}
                  />
                  <span>{device.signal}%</span>
                </div>
                <div
                  className={`battery-cell ${device.battery < 50 ? "low" : ""}`}
                >
                  <BatteryCharging size={15} />
                  <span>{device.battery}%</span>
                </div>
                <span className={device.latency > 15 ? "latency-warn" : ""}>
                  {device.latency} ms
                </span>
                <span className="mix-tag">{device.role}</span>
                <span
                  className={`device-status ${device.status === "Atenção" ? "warn" : ""}`}
                >
                  <StatusDot
                    tone={device.status === "Atenção" ? "warn" : "good"}
                  />{" "}
                  {device.status}
                </span>
                <button className="icon-button">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
        </div>
      </section>
      <div className="recommendation">
        <div className="recommendation-icon">
          <Wifi size={18} />
        </div>
        <div>
          <strong>Rede dedicada recomendada</strong>
          <p>
            Use um roteador Wi-Fi 5 GHz exclusivo, ligado ao servidor por
            Ethernet CAT6. Seus músicos terão mais estabilidade e menor
            latência.
          </p>
        </div>
        <button className="text-action" onClick={() => onView("settings")}>
          Ver recomendações <ChevronRight size={15} />
        </button>
      </div>
    </>
  );
}

function Mixes({ onView }: { onView: (view: View) => void }) {
  const mixes = [
    {
      title: "Domingo · Culto",
      meta: "5 músicos · atualizado há 12 min",
      color: "aqua",
      icon: "◒",
    },
    {
      title: "Ensaio · Neon Chapel",
      meta: "5 músicos · ontem, 21:14",
      color: "violet",
      icon: "♬",
    },
    {
      title: "Show · Teatro Central",
      meta: "8 músicos · 18 out 2026",
      color: "amber",
      icon: "✦",
    },
    {
      title: "Vocal principal · Rafa",
      meta: "Mix pessoal · 16 out 2026",
      color: "coral",
      icon: "◉",
    },
  ];
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <Library size={14} /> BIBLIOTECA LOCAL
          </div>
          <h1>Mixes bank</h1>
          <p>
            Snapshots e estruturas prontas para entrar em cena sem improviso.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <Download size={15} /> Importar JSON
          </button>
          <button
            className="primary-button"
            onClick={() =>
              toast.success("Nova mixagem criada", {
                description:
                  "Comece pelo patch vazio ou aplique um preset master.",
              })
            }
          >
            <Plus size={15} /> Nova mixagem
          </button>
        </div>
      </div>
      <div className="filter-row">
        <div className="search-field wide">
          <Search size={15} />
          <input placeholder="Buscar mixagens, shows ou músicos" />
        </div>
        <button className="filter-button">
          Todos os palcos <ChevronDown size={14} />
        </button>
        <button className="filter-button">
          Mais recentes <ChevronDown size={14} />
        </button>
      </div>
      <div className="mix-grid">
        {mixes.map(mix => (
          <button
            className="mix-card"
            key={mix.title}
            onClick={() => onView("mixer")}
          >
            <div className={`mix-cover ${mix.color}`}>
              <span>{mix.icon}</span>
              <div className="cover-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <strong>48 kHz</strong>
            </div>
            <div className="mix-card-body">
              <div>
                <span className="eyebrow">SNAPSHOT</span>
                <h3>{mix.title}</h3>
                <p>{mix.meta}</p>
              </div>
              <MoreHorizontal size={17} />
            </div>
            <div className="mix-card-footer">
              <span>
                <Check size={13} /> Backup local
              </span>
              <span>8 canais</span>
            </div>
          </button>
        ))}
        <button
          className="mix-card add-card"
          onClick={() =>
            toast.info("Escolha um ponto de partida", {
              description:
                "Você poderá começar do zero ou duplicar um snapshot.",
            })
          }
        >
          <Plus size={24} />
          <strong>Criar nova mixagem</strong>
          <span>Comece do zero ou duplique um snapshot.</span>
        </button>
      </div>
      <div className="backup-strip">
        <div className="backup-icon">
          <RefreshCw size={16} />
        </div>
        <div>
          <strong>Backup automático ativo</strong>
          <span>Último backup há 4 minutos · 28 snapshots preservados</span>
        </div>
        <button className="text-action">
          Ver histórico <ChevronRight size={15} />
        </button>
      </div>
    </>
  );
}

function Presets() {
  const [active, setActive] = useState("master");
  const masters = [
    "Bright & Tight",
    "Wide Stage",
    "Warm Vocals",
    "Drums Forward",
    "Natural",
    "Club",
    "Worship",
    "Custom",
  ];
  const channels = [
    "Vocal principal",
    "Vocal feminino",
    "Guitarra limpa",
    "Baixo",
    "Bumbo",
    "Click",
    "Talkback",
  ];
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <Sparkles size={14} /> PROCESSAMENTO INTELIGENTE
          </div>
          <h1>Presets</h1>
          <p>
            Uma assinatura sonora consistente para cada músico e cada palco.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <Upload size={15} /> Importar preset
          </button>
          <button
            className="primary-button"
            onClick={() =>
              toast.success("Preset salvo", {
                description: "Seu preset aparece agora em Custom.",
              })
            }
          >
            <Plus size={15} /> Criar preset
          </button>
        </div>
      </div>
      <div className="preset-tabs">
        <button
          className={active === "master" ? "active" : ""}
          onClick={() => setActive("master")}
        >
          <Radio size={15} /> Presets master <span>8</span>
        </button>
        <button
          className={active === "channel" ? "active" : ""}
          onClick={() => setActive("channel")}
        >
          <Mic2 size={15} /> Presets por canal <span>12</span>
        </button>
      </div>
      <div className="preset-layout">
        <section className="panel preset-panel">
          <SectionTitle
            eyebrow={
              active === "master" ? "MIX COMPLETA" : "PROCESSAMENTO POR FONTE"
            }
            title={active === "master" ? "Presets master" : "Presets por canal"}
            action="Ordenar"
          />
          <div className="preset-list">
            {(active === "master" ? masters : channels).map((preset, index) => (
              <button
                className={`preset-row ${index === 0 ? "selected" : ""}`}
                key={preset}
                onClick={() =>
                  toast.success(`${preset} aplicado`, {
                    description: "Aplicado somente à Mix 01 · Rafa.",
                  })
                }
              >
                <span
                  className={`preset-swatch ${["aqua", "violet", "coral", "amber", "blue", "pink", "green", "muted"][index % 8]}`}
                />{" "}
                <div>
                  <strong>{preset}</strong>
                  <span>
                    {active === "master"
                      ? `${index === 0 ? "Meu favorito · " : ""}EQ, compressor e panorama`
                      : "EQ 4 bandas · compressor"}
                  </span>
                </div>
                <span className="preset-uses">
                  {index === 0 ? "USADO AGORA" : `${index + 2} mixes`}
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel preset-detail">
          <div className="detail-header">
            <div>
              <span className="eyebrow">PRÉVIA DO PRESET</span>
              <h2>
                {active === "master" ? "Bright & Tight" : "Vocal principal"}
              </h2>
              <p>Aplicado por último em Mix 01 · Rafa</p>
            </div>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
          <div className="eq-preview">
            <div className="eq-grid">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <svg viewBox="0 0 300 110" preserveAspectRatio="none">
              <path d="M0 88 C 32 87, 45 80, 75 76 S 108 53, 132 64 S 158 70, 183 45 S 219 30, 240 38 S 278 18, 300 10" />
            </svg>
            <div className="eq-labels">
              <span>60</span>
              <span>250</span>
              <span>1k</span>
              <span>4k</span>
              <span>16k</span>
            </div>
          </div>
          <div className="detail-knobs">
            <div>
              <span>GRAVE</span>
              <strong>+1.5 dB</strong>
              <i style={{ transform: "rotate(28deg)" }} />
            </div>
            <div>
              <span>MÉDIO</span>
              <strong>-0.8 dB</strong>
              <i style={{ transform: "rotate(-15deg)" }} />
            </div>
            <div>
              <span>AGUDO</span>
              <strong>+2.2 dB</strong>
              <i style={{ transform: "rotate(44deg)" }} />
            </div>
            <div>
              <span>WIDTH</span>
              <strong>118%</strong>
              <i style={{ transform: "rotate(70deg)" }} />
            </div>
          </div>
          <div className="detail-actions">
            <button className="secondary-button">
              <Copy size={14} /> Duplicar
            </button>
            <button className="primary-button">
              <Check size={14} /> Aplicar à mix
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Rehearsal() {
  const [playing, setPlaying] = useState(false);
  const [click, setClick] = useState(true);
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <Music2 size={14} /> SETLIST · SESSÃO DE ENSAIO
          </div>
          <h1>Modo ensaio</h1>
          <p>O mapa da música ao lado da mix, sem tirar o foco do palco.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <BookOpen size={15} /> Abrir setlist
          </button>
          <button
            className={`primary-button ${playing ? "playing" : ""}`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
            {playing ? "Pausar sessão" : "Iniciar sessão"}
          </button>
        </div>
      </div>
      <div className="rehearsal-grid">
        <section className="panel setlist-panel">
          <div className="setlist-head">
            <div>
              <span className="eyebrow">SETLIST ATIVO</span>
              <h2>Neon Chapel · Outubro</h2>
            </div>
            <span className="song-count">05 músicas</span>
          </div>
          <div className="song-list">
            {[
              {
                title: "01 · Luz no Vale",
                key: "D",
                bpm: "96 BPM",
                note: "Entrada suave · vocal entra no verso 2",
              },
              {
                title: "02 · Casa Aberta",
                key: "G",
                bpm: "84 BPM",
                note: "Ponte com vozes · atenção ao delay",
              },
              {
                title: "03 · Tudo em Ti",
                key: "A",
                bpm: "128 BPM",
                note: "Click desde intro · virada no compasso 8",
              },
              {
                title: "04 · Respira",
                key: "E",
                bpm: "72 BPM",
                note: "Balada · abre a guitarra no refrão",
              },
              {
                title: "05 · Encore",
                key: "C",
                bpm: "110 BPM",
                note: "Final aberto · sem click no último refrão",
              },
            ].map((song, index) => (
              <button
                className={`song-row ${index === 0 ? "active" : ""}`}
                key={song.title}
              >
                <span className="song-number">
                  {index === 0 ? (
                    <Play size={12} fill="currentColor" />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <strong>{song.title}</strong>
                  <span>{song.note}</span>
                </div>
                <b>{song.key}</b>
                <small>{song.bpm}</small>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel click-panel">
          <div className="click-visual">
            <div className={`click-orb ${playing ? "active" : ""}`}>
              <span>{playing ? "01:42" : "00:00"}</span>
              <small>SESSÃO</small>
            </div>
            <div className="tempo-readout">
              <span>TEMPO</span>
              <strong>
                96 <small>BPM</small>
              </strong>
              <div>
                <button>−</button>
                <button>+</button>
              </div>
            </div>
          </div>
          <div className="click-options">
            <div className="option-row">
              <div>
                <Timer size={15} />
                <span>Click / metrônomo</span>
              </div>
              <button
                className={`toggle ${click ? "on" : ""}`}
                onClick={() => setClick(!click)}
              >
                <i />
              </button>
            </div>
            <div className="option-row">
              <div>
                <UsersRound size={15} />
                <span>Enviar para</span>
              </div>
              <strong>
                Rafa, Bia, Caio <ChevronDown size={14} />
              </strong>
            </div>
            <div className="option-row">
              <div>
                <VolumeIcon />
                <span>Volume do click</span>
              </div>
              <input
                type="range"
                defaultValue="58"
                aria-label="Volume do click"
              />
            </div>
          </div>
          <div className="mark-list">
            <span className="eyebrow">MARCAÇÕES DA MÚSICA</span>
            <div>
              <span>
                <i className="mark-dot coral" /> Vocal entra
              </span>
              <span>00:42</span>
            </div>
            <div>
              <span>
                <i className="mark-dot aqua" /> Ponte
              </span>
              <span>01:28</span>
            </div>
            <div>
              <span>
                <i className="mark-dot amber" /> Refrão final
              </span>
              <span>02:16</span>
            </div>
          </div>
        </section>
      </div>
      <div className="rehearsal-bottom">
        <div>
          <FileAudio size={16} />
          <div>
            <strong>Gravação de referência</strong>
            <span>Capture a Mix 01 para ouvir depois</span>
          </div>
        </div>
        <button className="secondary-button">
          <CircleHelp size={15} /> Como funciona
        </button>
        <button className="primary-button">
          <div className="record-dot" /> Iniciar gravação
        </button>
      </div>
    </>
  );
}

function VolumeIcon() {
  return (
    <span className="volume-icon">
      <span />
      <span />
      <span />
    </span>
  );
}

function Reports() {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <FileText size={14} /> HISTÓRICO TÉCNICO
          </div>
          <h1>Relatórios</h1>
          <p>
            Saiba o que aconteceu no palco antes que alguém precise perguntar.
          </p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <Download size={15} /> Exportar CSV
          </button>
          <button className="primary-button">
            <FileText size={15} /> Gerar relatório
          </button>
        </div>
      </div>
      <div className="report-summary">
        <div>
          <span>SESSÕES ANALISADAS</span>
          <strong>24</strong>
          <em>
            <ArrowUpRight size={12} /> +6 este mês
          </em>
        </div>
        <div>
          <span>LATÊNCIA MÉDIA</span>
          <strong>
            10.8 <small>ms</small>
          </strong>
          <em>
            <ArrowDownRight size={12} /> -1.4 ms
          </em>
        </div>
        <div>
          <span>ESTABILIDADE</span>
          <strong>
            99.4<small>%</small>
          </strong>
          <em>
            <ArrowUpRight size={12} /> +0.8%
          </em>
        </div>
        <div>
          <span>DROPOUTS</span>
          <strong>3</strong>
          <em className="neutral">Nenhum hoje</em>
        </div>
      </div>
      <section className="panel chart-panel">
        <div className="chart-head">
          <div>
            <span className="eyebrow">ESTABILIDADE DA REDE</span>
            <h2>Últimos 30 minutos</h2>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-line aqua" /> Packet loss
            </span>
            <span>
              <i className="legend-line violet" /> Latência
            </span>
            <button className="filter-button">
              30 min <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <div className="chart">
          <div className="chart-y">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <div className="chart-area">
            <div className="chart-grid">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <svg viewBox="0 0 720 220" preserveAspectRatio="none">
              <path
                className="chart-fill"
                d="M0 42 L38 50 L76 44 L114 65 L152 54 L190 58 L228 45 L266 52 L304 40 L342 48 L380 35 L418 40 L456 32 L494 38 L532 31 L570 45 L608 37 L646 44 L684 30 L720 36 L720 220 L0 220 Z"
              />
              <path
                className="chart-path aqua"
                d="M0 42 L38 50 L76 44 L114 65 L152 54 L190 58 L228 45 L266 52 L304 40 L342 48 L380 35 L418 40 L456 32 L494 38 L532 31 L570 45 L608 37 L646 44 L684 30 L720 36"
              />
              <path
                className="chart-path violet"
                d="M0 124 L38 119 L76 130 L114 113 L152 118 L190 107 L228 115 L266 104 L304 109 L342 96 L380 106 L418 92 L456 101 L494 88 L532 95 L570 83 L608 94 L646 80 L684 88 L720 75"
              />
            </svg>
            <div className="chart-x">
              <span>19:30</span>
              <span>19:40</span>
              <span>19:50</span>
              <span>20:00</span>
              <span>20:10</span>
            </div>
          </div>
        </div>
      </section>
      <section className="panel full-panel sessions-panel">
        <SectionTitle
          eyebrow="SESSÕES RECENTES"
          title="Histórico de operação"
          action="Ver todos"
        />
        <div className="table-head report-table">
          <span>SESSÃO</span>
          <span>PALCO</span>
          <span>DURAÇÃO</span>
          <span>LATÊNCIA</span>
          <span>ESTABILIDADE</span>
          <span>ARQUIVO</span>
        </div>
        {[
          "Ensaio · Neon Chapel",
          "Culto · Domingo noite",
          "Passagem de som · Teatro Central",
        ].map((name, index) => (
          <div className="report-row" key={name}>
            <div>
              <strong>{name}</strong>
              <span>
                {index === 0
                  ? "Hoje, 18:42"
                  : index === 1
                    ? "19 out 2026"
                    : "18 out 2026"}
              </span>
            </div>
            <span>{index === 2 ? "Palco B" : "Palco principal"}</span>
            <span>
              {index === 0 ? "01:42:18" : index === 1 ? "02:18:41" : "00:48:12"}
            </span>
            <span>
              {index === 0 ? "10 ms" : index === 1 ? "12 ms" : "14 ms"}
            </span>
            <strong className="stable-value">
              {index === 0 ? "99.8%" : index === 1 ? "99.2%" : "98.6%"}
            </strong>
            <button className="text-action">
              <Download size={14} /> JSON
            </button>
          </div>
        ))}
      </section>
    </>
  );
}

function Settings() {
  const [mode, setMode] = useState("dark");
  const [wifi, setWifi] = useState(true);
  const [lock, setLock] = useState(false);
  return (
    <>
      <div className="page-heading compact">
        <div>
          <div className="live-kicker">
            <Settings2 size={14} /> SISTEMA E PREFERÊNCIAS
          </div>
          <h1>Configurações</h1>
          <p>
            Deixe o dB Studio do seu jeito antes de abrir as portas do palco.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            onClick={() => toast.success("Configurações salvas")}
          >
            Salvar alterações
          </button>
        </div>
      </div>
      <div className="settings-layout">
        <aside className="settings-nav">
          <button className="active">
            <Laptop2 size={16} /> Geral
          </button>
          <button>
            <FileAudio size={16} /> Audio devices
          </button>
          <button>
            <Network size={16} /> Rede & diagnóstico
          </button>
          <button>
            <UsersRound size={16} /> Permissões
          </button>
          <button>
            <BookOpen size={16} /> Ajuda & onboarding
          </button>
        </aside>
        <section className="settings-content">
          <div className="settings-section">
            <div className="settings-section-head">
              <div>
                <span className="eyebrow">APARÊNCIA</span>
                <h2>Como você enxerga o palco</h2>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <strong>Tema da interface</strong>
                <span>
                  O tema escuro reduz reflexos e fadiga em operação noturna.
                </span>
              </div>
              <div className="theme-options">
                <button
                  className={mode === "dark" ? "active" : ""}
                  onClick={() => setMode("dark")}
                >
                  <span className="theme-preview dark-preview" /> Escuro
                </button>
                <button
                  className={mode === "light" ? "active" : ""}
                  onClick={() => setMode("light")}
                >
                  <span className="theme-preview light-preview" /> Claro
                </button>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <strong>Modo acessibilidade</strong>
                <span>
                  Fontes maiores, alto contraste e controles ampliados.
                </span>
              </div>
              <button
                className="toggle"
                onClick={() => toast.info("Acessibilidade pronta para ativar")}
              >
                <i />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-section-head">
              <div>
                <span className="eyebrow">ÁUDIO E SEGURANÇA</span>
                <h2>Proteja o sinal</h2>
              </div>
              <span className="settings-status">
                <StatusDot /> Tudo em ordem
              </span>
            </div>
            <div className="setting-row">
              <div>
                <strong>Limiter de segurança</strong>
                <span>
                  Evita clipping e volume excessivo no master de cada músico.
                </span>
              </div>
              <button className="toggle on">
                <i />
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>Bloquear ajustes remotos</strong>
                <span>
                  Exige autorização do técnico para EQ, efeitos e master.
                </span>
              </div>
              <button
                className={`toggle ${lock ? "on" : ""}`}
                onClick={() => setLock(!lock)}
              >
                <i />
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>Descoberta automática</strong>
                <span>
                  Permite que novos dispositivos encontrem este servidor na rede
                  local.
                </span>
              </div>
              <button
                className={`toggle ${wifi ? "on" : ""}`}
                onClick={() => setWifi(!wifi)}
              >
                <i />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-section-head">
              <div>
                <span className="eyebrow">IDIOMA</span>
                <h2>Fale com a sua equipe</h2>
              </div>
            </div>
            <div className="language-grid">
              <button className="active">
                <span>BR</span>
                <div>
                  <strong>Português (Brasil)</strong>
                  <small>Idioma atual</small>
                </div>
                <Check size={15} />
              </button>
              <button>
                <span>US</span>
                <div>
                  <strong>English</strong>
                  <small>English</small>
                </div>
              </button>
              <button>
                <span>ES</span>
                <div>
                  <strong>Español</strong>
                  <small>Español</small>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [view, setView] = useState<View>(getInitialView(location));
  const [channels, setChannels] = useState(channelsSeed);
  const [devices] = useState(devicesSeed);
  const [selectedDevice, setSelectedDevice] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [detailChannel, setDetailChannel] = useState<Channel | null>(null);

  const updateView = (next: View) => {
    setView(next);
    setLocation(next === "dashboard" ? "/" : `/${next}`);
  };
  const updateChannel = (id: number, patch: Partial<Channel>) =>
    setChannels(current =>
      current.map(channel =>
        channel.id === id ? { ...channel, ...patch } : channel
      )
    );
  const activeCount = useMemo(
    () => channels.filter(channel => !channel.mute).length,
    [channels]
  );

  return (
    <AppShell
      view={view}
      onView={updateView}
      sessionSaved={sessionSaved}
      onSave={() => {
        setSessionSaved(true);
        toast.success("Sessão salva", {
          description: "Todos os parâmetros locais foram preservados.",
        });
      }}
    >
      {view === "dashboard" && (
        <Dashboard
          onView={updateView}
          devices={devices}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
        />
      )}
      {view === "mixer" && (
        <Mixer
          channels={channels}
          onUpdate={updateChannel}
          onDetail={setDetailChannel}
          onView={updateView}
        />
      )}
      {view === "devices" && <Devices devices={devices} onView={updateView} />}
      {view === "mixes" && <Mixes onView={updateView} />}
      {view === "presets" && <Presets />}
      {view === "rehearsal" && <Rehearsal />}
      {view === "reports" && <Reports />}
      {view === "settings" && <Settings />}
      <footer className="app-footer">
        <span>
          <StatusDot /> dB Studio Server · v0.8.0 beta
        </span>
        <span>
          {activeCount} canais ativos ·{" "}
          <span className="mono">48 kHz / 16 bit</span>
        </span>
      </footer>
      {detailChannel && (
        <div className="modal-scrim" onClick={() => setDetailChannel(null)}>
          <section
            className="channel-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className={`channel-icon ${detailChannel.color}`}>
                  {detailChannel.icon === "mic" ? (
                    <Mic2 size={17} />
                  ) : (
                    <Music2 size={17} />
                  )}
                </span>
                <div>
                  <span className="eyebrow">
                    CANAL {String(detailChannel.id).padStart(2, "0")}
                  </span>
                  <h2>{detailChannel.name}</h2>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setDetailChannel(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-tabs">
              <button className="active">EQ</button>
              <button>Compressor</button>
              <button>Efeitos</button>
            </div>
            <div className="modal-eq">
              <div className="eq-grid">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <svg viewBox="0 0 420 160" preserveAspectRatio="none">
                <path d="M0 114 C 50 112, 72 104, 110 104 S 144 94, 176 88 S 218 102, 250 82 S 291 61, 323 68 S 372 43, 420 38" />
              </svg>
            </div>
            <div className="eq-bands">
              {["LOW", "LOW MID", "HIGH MID", "HIGH"].map((label, index) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>
                    {index === 0
                      ? "+1.5"
                      : index === 1
                        ? "-0.8"
                        : index === 2
                          ? "+2.2"
                          : "+1.0"}{" "}
                    <small>dB</small>
                  </strong>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={[58, 44, 68, 63][index]}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => toast.info("EQ zerado")}
              >
                Flat
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setDetailChannel(null);
                  toast.success("Ajustes aplicados", {
                    description: `${detailChannel.name} atualizado na Mix 01.`,
                  });
                }}
              >
                <Check size={15} /> Aplicar
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
