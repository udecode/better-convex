import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

describe('package intent metadata', () => {
  const packageDir = path.resolve(import.meta.dir, '..');
  const packageJsonPath = path.join(packageDir, 'package.json');
  const require = createRequire(packageJsonPath);

  // `npm pack` costs ~1.2s. Every assertion below reads the same tarball built
  // from the same working tree, so pack once and share it.
  let packDir: string;
  let tarballPath: string;
  let packedFilePaths: string[];

  beforeAll(() => {
    packDir = mkdtempSync(path.join(os.tmpdir(), 'kitcn-pack-'));

    const pack = Bun.spawnSync({
      cmd: ['npm', 'pack', '--json'],
      cwd: packageDir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        npm_config_pack_destination: packDir,
      },
    });

    if (pack.exitCode !== 0) {
      throw new Error(
        `npm pack failed: ${new TextDecoder().decode(pack.stderr).trim()}`
      );
    }

    const [result] = JSON.parse(
      new TextDecoder().decode(pack.stdout)
    ) as Array<{
      files: Array<{ path: string }>;
      filename: string;
    }>;

    if (!result) {
      throw new Error('npm pack produced no result.');
    }

    tarballPath = path.join(packDir, result.filename);
    packedFilePaths = result.files.map((file) => file.path);
  });

  afterAll(() => {
    rmSync(packDir, { force: true, recursive: true });
  });

  const resolveInstalledPackageRoot = (packageName: string) => {
    try {
      return path.dirname(require.resolve(`${packageName}/package.json`));
    } catch {
      const entryPath = require.resolve(packageName);
      let current = path.dirname(entryPath);

      while (true) {
        const candidate = path.join(current, 'package.json');
        if (existsSync(candidate)) {
          const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as {
            name?: string;
          };
          if (parsed.name === packageName) {
            return current;
          }
        }

        const parent = path.dirname(current);
        if (parent === current) {
          throw new Error(
            `Could not resolve installed root for ${packageName}.`
          );
        }
        current = parent;
      }
    }
  };

  test('declares intent metadata and packs the convex skill', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      bin?: Record<string, string>;
      dependencies?: Record<string, string>;
      exports?: Record<string, string>;
      files?: string[];
      keywords?: string[];
      intent?: {
        version?: number;
        repo?: string;
        docs?: string;
      };
    };

    expect(packageJson.files).toContain('skills');
    expect(packageJson.files).toContain('bin');
    expect(packageJson.keywords).toContain('tanstack-intent');
    expect(packageJson.bin?.intent).toBe('./bin/intent.js');
    expect(packageJson.dependencies?.typescript).toBeDefined();
    expect(packageJson.exports?.['./ratelimit']).toBe(
      './dist/ratelimit/index.js'
    );
    expect(packageJson.exports?.['./ratelimit/react']).toBe(
      './dist/ratelimit/react/index.js'
    );
    expect(packageJson.exports?.['./auth/start']).toBe(
      './dist/auth/start/index.js'
    );
    expect(packageJson.exports?.['./auth/start/server']).toBe(
      './dist/auth/start/server/index.js'
    );
    expect(packageJson.intent).toEqual({
      version: 1,
      repo: 'udecode/kitcn',
      docs: 'https://kitcn.dev/docs',
    });

    expect(packedFilePaths).toEqual(
      expect.arrayContaining([
        'bin/intent.js',
        'skills/kitcn/SKILL.md',
        'skills/kitcn/references/setup/index.md',
        'skills/kitcn/references/features/create-plugins.md',
      ])
    );

    const extract = Bun.spawnSync({
      cmd: ['tar', '-xOf', tarballPath, 'package/package.json'],
      cwd: packageDir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    });

    expect(extract.exitCode).toBe(0);

    const packedPackageJson = JSON.parse(
      new TextDecoder().decode(extract.stdout)
    ) as {
      dependencies?: Record<string, string>;
    };

    expect(packedPackageJson.dependencies?.typescript).toBeDefined();
  });

  test('packed cli prints version without typescript in the install tree', () => {
    const installDir = mkdtempSync(path.join(os.tmpdir(), 'kitcn-install-'));

    try {
      const installNodeModulesDir = path.join(installDir, 'node_modules');
      const packageInstallDir = path.join(installNodeModulesDir, 'kitcn');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        version?: string;
      };

      mkdirSync(packageInstallDir, { recursive: true });

      const unpack = Bun.spawnSync({
        cmd: [
          'tar',
          '-xzf',
          tarballPath,
          '-C',
          packageInstallDir,
          '--strip-components=1',
        ],
        cwd: packageDir,
        stdout: 'pipe',
        stderr: 'pipe',
        env: process.env,
      });

      expect(unpack.exitCode).toBe(0);

      for (const dependencyName of [
        ...Object.keys(packageJson.dependencies ?? {}),
        'convex',
      ]) {
        if (dependencyName === 'type-fest' || dependencyName === 'typescript') {
          continue;
        }
        const dependencyRoot = resolveInstalledPackageRoot(dependencyName);
        const dependencyLinkPath = path.join(
          installNodeModulesDir,
          ...dependencyName.split('/')
        );
        mkdirSync(path.dirname(dependencyLinkPath), { recursive: true });
        symlinkSync(dependencyRoot, dependencyLinkPath);
      }

      expect(existsSync(path.join(installNodeModulesDir, 'typescript'))).toBe(
        false
      );

      const versionResult = Bun.spawnSync({
        cmd: [
          'node',
          path.join(packageInstallDir, 'dist', 'cli.mjs'),
          '--version',
        ],
        cwd: installDir,
        stdout: 'pipe',
        stderr: 'pipe',
        env: process.env,
      });

      expect(versionResult.exitCode).toBe(0);
      expect(new TextDecoder().decode(versionResult.stdout).trim()).toBe(
        packageJson.version
      );
    } finally {
      rmSync(installDir, { force: true, recursive: true });
    }
  });

  test('packed CLI keeps the direct kitcn/server parse shim rewrite', () => {
    const list = Bun.spawnSync({
      cmd: ['tar', '-tzf', tarballPath],
      cwd: packageDir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    });

    expect(list.exitCode).toBe(0);

    // Chunk names are a bundler detail; assert on the CLI output as a whole.
    const cliChunkPaths = new TextDecoder()
      .decode(list.stdout)
      .split('\n')
      .filter((entry) => /^package\/dist\/[^/]+\.mjs$/.test(entry));

    expect(cliChunkPaths.length).toBeGreaterThan(0);

    const extract = Bun.spawnSync({
      cmd: ['tar', '-xOf', tarballPath, ...cliChunkPaths],
      cwd: packageDir,
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
    });

    expect(extract.exitCode).toBe(0);

    const cliSource = new TextDecoder().decode(extract.stdout);

    expect(cliSource).toContain('getProjectServerParserShimPath');
    expect(cliSource).toContain('evalModule');
    expect(cliSource).toContain('kitcn/server');
    expect(cliSource).toContain('tryNative: false');
  });
});
