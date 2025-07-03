import { fetchSidebar } from "@/basehub/actions";
import { SidebarClient } from "./client";

export const Sidebar = async () => {
  const sidebar = await fetchSidebar();

  return <SidebarClient sidebar={sidebar} />;
};
