import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  webpack: (config) => {
    console.log("webpack config", config);
    return config;
  },
};

export default config;
