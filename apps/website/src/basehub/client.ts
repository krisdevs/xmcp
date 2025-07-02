import { basehub } from "basehub";

let basehubInstance: ReturnType<typeof basehub> | null = null;

export function client(): ReturnType<typeof basehub> {
  if (!basehubInstance) {
    basehubInstance = basehub();
  }
  return basehubInstance;
}
