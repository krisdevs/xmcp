import { basehub, fragmentOn } from "basehub";

let basehubInstance: ReturnType<typeof basehub> | null = null;

export function client(): ReturnType<typeof basehub> {
  if (!basehubInstance) {
    basehubInstance = basehub();
  }
  return basehubInstance;
}

const AssetsFragment = fragmentOn("Assets", {
  glLogoMatcap: {
    url: true,
  },
});

export const fetchAssets = async () => {
  const res = await client().query({
    assets: {
      ...AssetsFragment,
    },
  });

  return res.assets;
};
