import { fetchAssets } from "@/basehub/actions";
import { XmcpLogo as ThreeLogo } from "./client";

export const XmcpLogo = async () => {
  const assets = await fetchAssets();

  return <ThreeLogo matcap={assets.glLogoMatcap.url} />;
};
