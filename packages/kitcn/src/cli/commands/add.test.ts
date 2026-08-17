import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ANSI_ESCAPE_RE,
  createDefaultConfig,
  writeMinimalSchema,
  writePackageJson,
  writeShadcnNextApp,
} from '../test-utils';
import {
  ADD_HELP_TEXT,
  handleAddCommand,
  mergeBaselineAndPluginInstall,
  parseAddCommandArgs,
} from './add';

const MERGED_INSTALL_FAILURE_RE =
  /Installing baseline dependencies and the auth package: Dependency install failed/;

const writeAuthProject = (prefix: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  writeShadcnNextApp(dir);
  fs.mkdirSync(path.join(dir, 'convex', 'functions'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'convex', 'functions', 'schema.ts'),
    'import { defineSchema } from "kitcn/orm";\n\nexport default defineSchema({});\n'
  );
  return dir;
};

const makeGenerateMetaStub = (dir: string) =>
  mock(async (sharedDir: string) => {
    const generatedAuthPath = path.join(
      dir,
      sharedDir,
      '..',
      'functions',
      'generated',
      'auth.ts'
    );
    fs.mkdirSync(path.dirname(generatedAuthPath), { recursive: true });
    fs.writeFileSync(generatedAuthPath, 'export {};\n');
  });

describe('cli/commands/add', () => {
  test('parseAddCommandArgs supports dry-run, diff, view, overwrite, no-codegen, and preset', () => {
    expect(
      parseAddCommandArgs([
        'resend',
        '--yes',
        '--json',
        '--diff',
        'convex/plugins/resend.ts',
        '--view=convex/schema.ts',
        '--overwrite',
        '--no-codegen',
        '--preset',
        'default',
      ])
    ).toEqual({
      plugin: 'resend',
      yes: true,
      json: true,
      dryRun: true,
      overwrite: true,
      noCodegen: true,
      schema: false,
      preset: 'default',
      diff: 'convex/plugins/resend.ts',
      view: 'convex/schema.ts',
    });
  });

  test('parseAddCommandArgs supports auth schema sync', () => {
    expect(parseAddCommandArgs(['auth', '--schema', '--yes'])).toEqual({
      plugin: 'auth',
      yes: true,
      json: false,
      dryRun: false,
      overwrite: false,
      noCodegen: false,
      schema: true,
      preset: undefined,
      diff: undefined,
      view: undefined,
    });
  });

  test('parseAddCommandArgs rejects legacy schema-only flags', () => {
    expect(() =>
      parseAddCommandArgs(['auth', '--only', 'schema', '--yes'])
    ).toThrow('Use `--schema` instead of `--only schema`.');
  });

  test('parseAddCommandArgs rejects --overwrite on auth schema sync', () => {
    expect(() =>
      parseAddCommandArgs(['auth', '--schema', '--overwrite', '--yes'])
    ).toThrow(
      'Auth schema sync is additive. Do not pass `--overwrite`; use `kitcn add auth --schema --yes`.'
    );
  });

  test('handleAddCommand(--help) prints add help and exits without writes', async () => {
    const execaStub = mock(async () => ({ exitCode: 0 }) as any);
    const generateMetaStub = mock(async () => {});
    const syncEnvStub = mock(async () => {});
    const loadConfigStub = mock(() => createDefaultConfig());
    const infoLines: string[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      infoLines.push(args.map(String).join(' '));
    };
    try {
      const exitCode = await handleAddCommand(['add', '--help'], {
        realConvex: '/fake/convex/main.js',
        execa: execaStub as any,
        generateMeta: generateMetaStub as any,
        syncEnv: syncEnvStub as any,
        loadCliConfig: loadConfigStub as any,
      });
      expect(exitCode).toBe(0);
      expect(execaStub).not.toHaveBeenCalled();
      expect(infoLines.join('\n')).toContain(ADD_HELP_TEXT);
    } finally {
      console.info = originalInfo;
    }
  });

  test('handleAddCommand renders ANSI-colored dry-run output directly from the command module', async () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'kitcn-add-command-dry-run-')
    );
    writePackageJson(tmpDir);
    writeMinimalSchema(tmpDir);

    const execaStub = mock(async () => ({ exitCode: 0 }) as any);
    const generateMetaStub = mock(async () => {});
    const syncEnvStub = mock(async () => {});
    const loadConfigStub = mock(() => createDefaultConfig());
    const infoLines: string[] = [];
    const originalInfo = console.info;
    const originalCwd = process.cwd();
    const originalForceColor = process.env.FORCE_COLOR;
    process.chdir(tmpDir);
    process.env.FORCE_COLOR = '1';
    console.info = (...args: unknown[]) => {
      infoLines.push(args.map(String).join(' '));
    };
    try {
      const exitCode = await handleAddCommand(
        ['add', 'resend', '--yes', '--dry-run'],
        {
          realConvex: '/fake/convex/main.js',
          execa: execaStub as any,
          generateMeta: generateMetaStub as any,
          syncEnv: syncEnvStub as any,
          loadCliConfig: loadConfigStub as any,
        }
      );
      expect(exitCode).toBe(0);
      expect(infoLines.join('\n')).toMatch(ANSI_ESCAPE_RE);
      expect(infoLines.join('\n')).toContain('kitcn add resend');
    } finally {
      process.chdir(originalCwd);
      process.env.FORCE_COLOR = originalForceColor;
      console.info = originalInfo;
    }
  });

  test('handleAddCommand reuses a running local convex backend for auth live bootstrap', async () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'kitcn-add-auth-live-bootstrap-reuse-')
    );
    const originalCwd = process.cwd();
    process.chdir(dir);

    writeShadcnNextApp(dir);
    fs.mkdirSync(path.join(dir, 'convex', 'functions'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'convex', 'functions', 'schema.ts'),
      'import { defineSchema } from "kitcn/orm";\n\nexport default defineSchema({});\n'
    );

    const execaStub = mock(
      async () => ({ exitCode: 0, stdout: '', stderr: '' }) as any
    );
    const syncEnvStub = mock(async () => {});
    const runLocalBootstrapStub = mock(async () => 0);
    const generateMetaStub = mock(async (sharedDir: string) => {
      const generatedAuthPath = path.join(
        dir,
        sharedDir,
        '..',
        'functions',
        'generated',
        'auth.ts'
      );
      fs.mkdirSync(path.dirname(generatedAuthPath), { recursive: true });
      fs.writeFileSync(generatedAuthPath, 'export {};\n');
    });

    try {
      const exitCode = await handleAddCommand(['add', 'auth', '--yes'], {
        realConvex: '/fake/convex/main.js',
        execa: execaStub as any,
        generateMeta: generateMetaStub as any,
        loadCliConfig: (() => createDefaultConfig()) as any,
        runLocalBootstrap: runLocalBootstrapStub as any,
        syncEnv: syncEnvStub as any,
      } as any);

      expect(exitCode).toBe(0);
      expect(syncEnvStub).toHaveBeenCalledWith({
        authSyncMode: 'auto',
        force: true,
        sharedDir: 'convex/shared',
        targetArgs: [],
      });
      expect(runLocalBootstrapStub).not.toHaveBeenCalled();
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('handleAddCommand falls back to local bootstrap when auth live bootstrap probe fails', async () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'kitcn-add-auth-live-bootstrap-fallback-')
    );
    const originalCwd = process.cwd();
    process.chdir(dir);

    writeShadcnNextApp(dir);
    fs.mkdirSync(path.join(dir, 'convex', 'functions'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'convex', 'functions', 'schema.ts'),
      'import { defineSchema } from "kitcn/orm";\n\nexport default defineSchema({});\n'
    );

    const execaStub = mock(
      async () => ({ exitCode: 0, stdout: '', stderr: '' }) as any
    );
    const syncEnvModes: string[] = [];
    const syncEnvStub = mock(async (params: { authSyncMode?: string }) => {
      syncEnvModes.push(params.authSyncMode ?? 'auto');
      throw new Error('local backend unavailable');
    });
    const runLocalBootstrapStub = mock(async () => 0);
    const generateMetaStub = mock(async (sharedDir: string) => {
      const generatedAuthPath = path.join(
        dir,
        sharedDir,
        '..',
        'functions',
        'generated',
        'auth.ts'
      );
      fs.mkdirSync(path.dirname(generatedAuthPath), { recursive: true });
      fs.writeFileSync(generatedAuthPath, 'export {};\n');
    });

    try {
      const exitCode = await handleAddCommand(['add', 'auth', '--yes'], {
        realConvex: '/fake/convex/main.js',
        execa: execaStub as any,
        generateMeta: generateMetaStub as any,
        loadCliConfig: (() => createDefaultConfig()) as any,
        runLocalBootstrap: runLocalBootstrapStub as any,
        syncEnv: syncEnvStub as any,
      } as any);

      expect(exitCode).toBe(0);
      expect(syncEnvModes).toEqual(['prepare', 'complete', 'auto']);
      expect(runLocalBootstrapStub).toHaveBeenCalledWith(
        expect.objectContaining({
          authSyncMode: 'auto',
          debug: false,
          sharedDir: 'convex/shared',
          targetArgs: [],
        })
      );
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('handleAddCommand issues one install for baseline plus the plugin package', async () => {
    const dir = writeAuthProject('kitcn-add-auth-single-install-');
    const originalCwd = process.cwd();
    process.chdir(dir);

    const installCommands: string[] = [];
    const execaStub = mock(async (command: string, args: string[] = []) => {
      if (args[0] === 'add' || args[0] === 'install') {
        installCommands.push([command, ...args].join(' '));
      }
      return { exitCode: 0, stdout: '', stderr: '' } as any;
    });

    try {
      const exitCode = await handleAddCommand(['add', 'auth', '--yes'], {
        realConvex: '/fake/convex/main.js',
        execa: execaStub as any,
        generateMeta: makeGenerateMetaStub(dir) as any,
        loadCliConfig: (() => createDefaultConfig()) as any,
        runLocalBootstrap: (async () => 0) as any,
        syncEnv: (async () => {}) as any,
      } as any);

      expect(exitCode).toBe(0);
      // Leg 1 is the planning install, which must land before the planner
      // loads Better Auth internals. Everything after it is one install.
      expect(installCommands).toHaveLength(2);
      expect(installCommands[0]).toContain('@opentelemetry/api');
      expect(installCommands[1]).toContain('convex@');
      expect(installCommands[1]).toContain('better-auth@');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('handleAddCommand attributes a merged install failure to its stage', async () => {
    const dir = writeAuthProject('kitcn-add-auth-install-failure-');
    const originalCwd = process.cwd();
    process.chdir(dir);

    const execaStub = mock(async (_command: string, args: string[] = []) => {
      const isMergedInstall =
        (args[0] === 'add' || args[0] === 'install') &&
        args.some((arg) => arg.startsWith('better-auth@'));
      return {
        exitCode: isMergedInstall ? 1 : 0,
        stdout: '',
        stderr: '',
      } as any;
    });

    try {
      await expect(
        handleAddCommand(['add', 'auth', '--yes'], {
          realConvex: '/fake/convex/main.js',
          execa: execaStub as any,
          generateMeta: makeGenerateMetaStub(dir) as any,
          loadCliConfig: (() => createDefaultConfig()) as any,
          runLocalBootstrap: (async () => 0) as any,
          syncEnv: (async () => {}) as any,
        } as any)
      ).rejects.toThrow(MERGED_INSTALL_FAILURE_RE);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('mergeBaselineAndPluginInstall only merges same-target legs', () => {
    const baseline = {
      packageManager: 'bun' as const,
      command: 'bun',
      args: ['add', 'convex@1.0.0'],
      packages: ['convex@1.0.0'],
      cwd: process.cwd(),
    };
    const plugin = {
      packageName: 'better-auth',
      packageSpec: 'better-auth@1.0.0',
      packageJsonPath: path.join(process.cwd(), 'package.json'),
      installed: false,
      skipped: false,
    };

    expect(mergeBaselineAndPluginInstall(baseline, plugin)).toEqual({
      ...baseline,
      args: ['add', 'convex@1.0.0', 'better-auth@1.0.0'],
      packages: ['convex@1.0.0', 'better-auth@1.0.0'],
    });

    expect(mergeBaselineAndPluginInstall(null, plugin)).toBeNull();
    expect(
      mergeBaselineAndPluginInstall(baseline, {
        ...plugin,
        skipped: true,
        reason: 'already_present',
      })
    ).toBeNull();
    expect(
      mergeBaselineAndPluginInstall(baseline, {
        ...plugin,
        packageJsonPath: path.join(os.tmpdir(), 'elsewhere', 'package.json'),
      })
    ).toBeNull();
    expect(
      mergeBaselineAndPluginInstall(
        { ...baseline, packageManager: 'npm', command: 'npm' },
        plugin
      )
    ).toBeNull();
  });
});
