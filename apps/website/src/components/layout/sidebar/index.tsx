import { generateSidebarTree } from "@/utils/markdown";
import { SidebarClient } from "./client";

export const Sidebar = async () => {
  const sidebar = generateSidebarTree();

  return <SidebarClient sidebar={sidebar} matcap="" />;
};
