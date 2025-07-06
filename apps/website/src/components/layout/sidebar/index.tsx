import { getSidebarTreeFromIndex } from "@/utils/markdown";
import { SidebarClient } from "./client";
import { fetchAssets } from "@/basehub";

export const Sidebar = async () => {
  const sidebar = getSidebarTreeFromIndex();
  const assets = await fetchAssets();

  return <SidebarClient sidebar={sidebar} matcap={assets.glLogoMatcap.url} />;
};
