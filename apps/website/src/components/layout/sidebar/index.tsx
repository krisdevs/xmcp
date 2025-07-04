import { fetchSidebar, fetchAssets } from "@/basehub/actions";
import { SidebarClient } from "./client";

export const Sidebar = async () => {
  const [sidebar, assets] = await Promise.all([fetchSidebar(), fetchAssets()]);

  return <SidebarClient sidebar={sidebar} matcap={assets.glLogoMatcap.url} />;
};
