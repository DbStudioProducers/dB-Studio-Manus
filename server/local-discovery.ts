import os from "node:os";
import { Bonjour, type Service } from "bonjour-service";

export type LocalDiscoveryInfo = {
  serviceType: "_dbstudio._tcp";
  name: string;
  host: string;
  port: number;
  protocol: "DBAU/1";
  version: "1";
};

export class LocalDiscovery {
  private readonly bonjour = new Bonjour();
  private service: Service | null = null;
  private readonly enabled = process.env.LOCAL_DISCOVERY_ENABLED !== "0";
  private readonly serviceName: string;

  constructor(private readonly httpPort: number) {
    this.serviceName =
      process.env.LOCAL_DISCOVERY_NAME ||
      `dB Studio Desktop ${os.hostname()} ${httpPort}`;
  }

  start() {
    if (!this.enabled || this.service) return;
    this.service = this.bonjour.publish({
      name: this.serviceName,
      type: "dbstudio",
      protocol: "tcp",
      port: this.httpPort,
      txt: {
        protocol: "DBAU/1",
        version: "1",
        product: "dB Studio",
      },
    });
    this.service.on("error", error => {
      console.warn(`[Discovery] ${error.message}`);
    });
    console.log(
      `[Discovery] mDNS _dbstudio._tcp published on ${this.httpPort}`
    );
  }

  getInfo(): LocalDiscoveryInfo {
    const host = os.hostname();
    return {
      serviceType: "_dbstudio._tcp",
      name: this.serviceName,
      host,
      port: this.httpPort,
      protocol: "DBAU/1",
      version: "1",
    };
  }

  stop() {
    this.service?.stop();
    this.service = null;
    this.bonjour.destroy();
  }
}
