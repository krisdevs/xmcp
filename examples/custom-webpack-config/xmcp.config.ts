import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  webpack: (config) => {
    // Add raw loader for images to get them as base64
    config.module?.rules?.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: "asset/inline",
    });

    return config;
  },
};

export default config;
