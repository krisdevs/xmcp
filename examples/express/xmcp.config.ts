import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  experimental: {
    adapter: true,
  },
};

export default config;
