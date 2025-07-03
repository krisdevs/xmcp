import { fetchAssets } from "@/basehub/actions";
import { CavasLogo } from "@/components/terminal/three-logo";

export default async function Page() {
  const assets = await fetchAssets();
  return (
    <div className="absolute inset-0 w-full h-full">
      <CavasLogo matcap={assets.glLogoMatcap.url} />
    </div>
  );
}
