import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCodegenFileCache } from './codegen-file-cache';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-file-cache-'));
}

describe('cli/utils/codegen-file-cache', () => {
  test('reads a path once per run', () => {
    const dir = mkTempDir();
    const filePath = path.join(dir, 'module.ts');
    fs.writeFileSync(filePath, 'first');
    const fileCache = createCodegenFileCache();

    expect(fileCache.read(filePath)).toBe('first');

    fs.writeFileSync(filePath, 'second');

    expect(fileCache.read(filePath)).toBe('first');
    expect(createCodegenFileCache().read(filePath)).toBe('second');
  });

  test('reports a missing path as absent instead of throwing', () => {
    const dir = mkTempDir();
    const fileCache = createCodegenFileCache();

    expect(fileCache.read(path.join(dir, 'missing.ts'))).toBeNull();
    expect(fileCache.read(path.join(dir, 'nested', 'missing.ts'))).toBeNull();
    expect(fileCache.read(dir)).toBeNull();
  });

  test('writeIfChanged leaves a matching file alone', () => {
    const dir = mkTempDir();
    const filePath = path.join(dir, 'module.ts');
    fs.writeFileSync(filePath, 'same');
    const fileCache = createCodegenFileCache();

    expect(fileCache.writeIfChanged(filePath, 'same')).toBe(false);
    expect(fileCache.writeIfChanged(filePath, 'next')).toBe(true);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('next');
  });

  test('a write is what later readers see', () => {
    const dir = mkTempDir();
    const filePath = path.join(dir, 'generated', 'auth.ts');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'stale');
    const fileCache = createCodegenFileCache();

    expect(fileCache.read(filePath)).toBe('stale');

    fileCache.write(filePath, 'fresh');

    expect(fileCache.read(filePath)).toBe('fresh');
    expect(fs.readFileSync(filePath, 'utf8')).toBe('fresh');
  });

  test('a removed file is rewritten with the content it used to hold', () => {
    const dir = mkTempDir();
    const filePath = path.join(dir, 'placeholder.runtime.ts');
    const fileCache = createCodegenFileCache();

    fileCache.write(filePath, 'placeholder');
    fileCache.remove(filePath);

    expect(fileCache.read(filePath)).toBeNull();
    expect(fs.existsSync(filePath)).toBe(false);
    // Codegen writes these placeholders, drops them, then writes the identical
    // bytes again in a later phase. A cache that only remembered the content
    // would treat the second write as a no-op and never recreate the file.
    expect(fileCache.writeIfChanged(filePath, 'placeholder')).toBe(true);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('placeholder');
  });

  test('a removed directory takes every path under it with it', () => {
    const dir = mkTempDir();
    const pluginsDir = path.join(dir, 'generated', 'plugins');
    const nestedFile = path.join(pluginsDir, 'ratelimit.runtime.ts');
    const siblingFile = path.join(dir, 'generated', 'server.ts');
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(nestedFile, 'runtime');
    fs.writeFileSync(siblingFile, 'server');
    const fileCache = createCodegenFileCache();

    expect(fileCache.read(nestedFile)).toBe('runtime');
    expect(fileCache.read(siblingFile)).toBe('server');

    fileCache.removeDirectory(pluginsDir);

    expect(fileCache.read(nestedFile)).toBeNull();
    expect(fileCache.read(siblingFile)).toBe('server');
    // Codegen wipes `generated/plugins` and re-emits the same runtime files
    // later in the run. Remembering the pre-wipe bytes would turn that re-emit
    // into a no-op and leave the plugin runtimes missing.
    fs.mkdirSync(pluginsDir, { recursive: true });

    expect(fileCache.writeIfChanged(nestedFile, 'runtime')).toBe(true);
    expect(fs.readFileSync(nestedFile, 'utf8')).toBe('runtime');
  });
});
