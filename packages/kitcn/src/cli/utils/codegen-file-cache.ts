import fs from 'node:fs';
import path from 'node:path';

const MISSING_FILE_ERROR_CODES = new Set(['ENOENT', 'ENOTDIR', 'EISDIR']);

/**
 * Owns every source read, generated write and generated removal inside a single
 * codegen run.
 *
 * Codegen wants the same module bytes several times per run — the
 * codegen-export prefilter, the runtime parser, the procedure-name lookup and
 * the emit phase all read the same file — and it rewrites its own `generated/`
 * files partway through. Routing all of that through one owner reads each path
 * once while staying correct: a write remembers what was just written and a
 * removal remembers "absent", so a later reader can never be handed bytes that
 * are no longer on disk.
 *
 * Lifetime is one run, never the process. A watch cycle re-runs codegen exactly
 * because the filesystem changed, so every run starts from an empty cache.
 */
export type CodegenFileCache = {
  /** File contents, or `null` when the path does not exist. */
  read: (filePath: string) => string | null;
  /** Delete a file and remember it as absent. */
  remove: (filePath: string) => void;
  /** Delete a directory tree and remember every path under it as absent. */
  removeDirectory: (dirPath: string) => void;
  /** Write unconditionally and remember the new contents. */
  write: (filePath: string, content: string) => void;
  /** Write only when contents differ. Returns whether the file changed. */
  writeIfChanged: (filePath: string, content: string) => boolean;
};

function isMissingFileError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code !== undefined && MISSING_FILE_ERROR_CODES.has(code);
}

export function createCodegenFileCache(): CodegenFileCache {
  const contentsByPath = new Map<string, string | null>();

  const read = (filePath: string): string | null => {
    const key = path.resolve(filePath);
    const cached = contentsByPath.get(key);
    if (cached !== undefined) {
      return cached;
    }

    let content: string | null;
    try {
      content = fs.readFileSync(key, 'utf8');
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error;
      }
      content = null;
    }

    contentsByPath.set(key, content);
    return content;
  };

  const write = (filePath: string, content: string): void => {
    fs.writeFileSync(filePath, content);
    contentsByPath.set(path.resolve(filePath), content);
  };

  return {
    read,
    write,
    writeIfChanged: (filePath, content) => {
      if (read(filePath) === content) {
        return false;
      }
      write(filePath, content);
      return true;
    },
    remove: (filePath) => {
      fs.rmSync(filePath, { force: true });
      contentsByPath.set(path.resolve(filePath), null);
    },
    removeDirectory: (dirPath) => {
      fs.rmSync(dirPath, { force: true, recursive: true });
      const prefix = `${path.resolve(dirPath)}${path.sep}`;
      for (const key of contentsByPath.keys()) {
        if (key.startsWith(prefix)) {
          contentsByPath.set(key, null);
        }
      }
    },
  };
}
