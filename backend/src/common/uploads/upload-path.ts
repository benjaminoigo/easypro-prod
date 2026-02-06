import * as fs from 'fs';
import { isAbsolute, join, resolve } from 'path';

export const getUploadRoot = (uploadDest?: string): string => {
  const dest = uploadDest?.trim() || './uploads';
  return isAbsolute(dest) ? dest : resolve(process.cwd(), dest);
};

export const ensureDir = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

export const getUploadSubdir = (uploadDest: string | undefined, subdir: string): string => {
  const root = getUploadRoot(uploadDest);
  const dir = join(root, subdir);
  ensureDir(dir);
  return dir;
};

export const toRelativeUploadPath = (
  filePath: string | undefined,
  uploadDest?: string,
): string | undefined => {
  if (!filePath) return filePath;

  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedRoot = getUploadRoot(uploadDest).replace(/\\/g, '/');

  if (normalizedPath.startsWith(normalizedRoot)) {
    return normalizedPath.slice(normalizedRoot.length).replace(/^\/+/, '');
  }

  return normalizedPath.replace(/^uploads[\\/]/, '');
};
