import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  webpack: (config) => {
    // Edit webpack config if needed
    return config;
  },
  stdio: true,
};

export default config;
