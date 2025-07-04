import { buildMain } from "./build-main";
import { buildRuntime } from "./build-runtime";

buildRuntime(() => {
  buildMain();
});
