import path from "path";

export const runtimeFolder = ".xmcp";
export const runtimeFolderPath = path.join(process.cwd(), runtimeFolder);

export const processFolder = process.cwd();
export const outputPath = path.join(processFolder, "dist");
