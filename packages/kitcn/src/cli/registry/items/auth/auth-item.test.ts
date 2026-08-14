import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyPluginInstallPlanFiles } from '../../../backend-core';
import { createDefaultConfig } from '../../../test-utils';
import { getPluginCatalogEntry } from '../../index';
import { INIT_CRPC_TEMPLATE } from '../../init/init-crpc.template.js';
import { INIT_HTTP_TEMPLATE } from '../../init/init-http.template.js';
import { INIT_NEXT_CONVEX_PROVIDER_TEMPLATE } from '../../init/next/init-next-convex-provider.template.js';
import { INIT_NEXT_SERVER_TEMPLATE } from '../../init/next/init-next-server.template.js';
import { renderInitTemplateContent } from '../../plan-helpers.js';
import {
  loadDefaultManagedAuthOptions,
  renderManagedAuthSchemaUnits,
} from './reconcile-auth-schema.js';

const silentPromptAdapter = {
  confirm: async () => false,
  isInteractive: () => false,
  multiselect: async () => [],
  select: async () => 'ignored',
};

const writeNextAuthProject = (dir: string, params: { userEdits: boolean }) => {
  const functionsDir = path.join(dir, 'convex', 'functions');
  const libDir = path.join(dir, 'convex', 'lib');
  const clientDir = path.join(dir, 'src', 'lib', 'convex');
  const crpcFilePath = path.join(libDir, 'crpc.ts');
  const httpFilePath = path.join(functionsDir, 'http.ts');
  fs.mkdirSync(functionsDir, { recursive: true });
  fs.mkdirSync(libDir, { recursive: true });
  fs.mkdirSync(clientDir, { recursive: true });

  const userSuffix = params.userEdits
    ? '\nexport const userOwnedMarker = 42;\n'
    : '';

  fs.writeFileSync(
    crpcFilePath,
    renderInitTemplateContent({
      template: INIT_CRPC_TEMPLATE,
      filePath: crpcFilePath,
      functionsDir,
      crpcFilePath,
    }) + userSuffix,
    'utf8'
  );
  fs.writeFileSync(
    httpFilePath,
    renderInitTemplateContent({
      template: INIT_HTTP_TEMPLATE,
      filePath: httpFilePath,
      functionsDir,
      crpcFilePath,
    }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(clientDir, 'convex-provider.tsx'),
    INIT_NEXT_CONVEX_PROVIDER_TEMPLATE + userSuffix,
    'utf8'
  );
  fs.writeFileSync(
    path.join(clientDir, 'server.ts'),
    INIT_NEXT_SERVER_TEMPLATE + userSuffix,
    'utf8'
  );

  return {
    config: createDefaultConfig(),
    functionsDir,
    lockfile: { plugins: {} },
    overwrite: false,
    preset: 'default' as const,
    preview: false,
    promptAdapter: silentPromptAdapter,
    roots: {
      appRootDir: path.join(dir, 'src', 'app'),
      clientLibRootDir: path.join(dir, 'src', 'lib'),
      crpcFilePath,
      envFilePath: path.join(libDir, 'get-env.ts'),
      functionsRootDir: functionsDir,
      libRootDir: libDir,
      projectContext: {
        appDir: 'src/app',
        clientEntryFile: null,
        componentsDir: 'src/components',
        convexClientDir: 'src/lib/convex',
        framework: 'next' as const,
        mode: 'next-app' as const,
      },
      sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
    },
    yes: true,
  };
};

describe('auth registry item overwrite safety', () => {
  test('does not clobber user-edited crpc.ts, provider, or server without --overwrite', async () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-owner-'))
    );
    const oldCwd = process.cwd();
    process.chdir(dir);

    try {
      const params = writeNextAuthProject(dir, { userEdits: true });
      const descriptor = getPluginCatalogEntry('auth');
      const files = descriptor.integration?.buildPlanFiles?.(params) ?? [];

      const result = await applyPluginInstallPlanFiles(files, {
        overwrite: false,
        yes: true,
        promptAdapter: silentPromptAdapter,
      });

      expect(result.refused).toEqual(
        expect.arrayContaining([
          'convex/lib/crpc.ts',
          'src/lib/convex/convex-provider.tsx',
          'src/lib/convex/server.ts',
        ])
      );
      // Refusals are not "already up to date" and must stay distinguishable.
      expect(result.skipped).toEqual([]);
      expect(
        fs.readFileSync(path.join(dir, 'convex', 'lib', 'crpc.ts'), 'utf8')
      ).toContain('userOwnedMarker');
      expect(
        fs.readFileSync(
          path.join(dir, 'src', 'lib', 'convex', 'convex-provider.tsx'),
          'utf8'
        )
      ).toContain('userOwnedMarker');
      expect(
        fs.readFileSync(
          path.join(dir, 'src', 'lib', 'convex', 'server.ts'),
          'utf8'
        )
      ).toContain('userOwnedMarker');
      // http.ts is patched in place, so it stays writable without --overwrite.
      expect(result.updated).toContain('convex/functions/http.ts');
    } finally {
      process.chdir(oldCwd);
    }
  });

  test('wires auth into crpc.ts after `add ratelimit` without --overwrite', async () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-owner-'))
    );
    const oldCwd = process.cwd();
    process.chdir(dir);

    try {
      const params = writeNextAuthProject(dir, { userEdits: false });
      const ratelimitFiles =
        getPluginCatalogEntry('ratelimit').integration?.buildPlanFiles?.(
          params
        ) ?? [];
      const ratelimitResult = await applyPluginInstallPlanFiles(
        ratelimitFiles,
        { overwrite: false, yes: true, promptAdapter: silentPromptAdapter }
      );
      expect(ratelimitResult.updated).toContain('convex/lib/crpc.ts');

      const authFiles =
        getPluginCatalogEntry('auth').integration?.buildPlanFiles?.(params) ??
        [];
      const authResult = await applyPluginInstallPlanFiles(authFiles, {
        overwrite: false,
        yes: true,
        promptAdapter: silentPromptAdapter,
      });

      expect(authResult.refused).toEqual([]);
      expect(authResult.updated).toContain('convex/lib/crpc.ts');

      const crpc = fs.readFileSync(
        path.join(dir, 'convex', 'lib', 'crpc.ts'),
        'utf8'
      );
      expect(crpc).toContain('export const authQuery = c.query');
      expect(crpc).toContain('export const authMutation = c.mutation');
      // The ratelimit wiring from the earlier `add` survives.
      expect(crpc).toContain('ratelimit.middleware()');
      expect(crpc).toContain('RatelimitBucket');
    } finally {
      process.chdir(oldCwd);
    }
  });

  test('upgrades untouched managed baselines without --overwrite', async () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-owner-'))
    );
    const oldCwd = process.cwd();
    process.chdir(dir);

    try {
      const params = writeNextAuthProject(dir, { userEdits: false });
      const descriptor = getPluginCatalogEntry('auth');
      const files = descriptor.integration?.buildPlanFiles?.(params) ?? [];

      const result = await applyPluginInstallPlanFiles(files, {
        overwrite: false,
        yes: true,
        promptAdapter: silentPromptAdapter,
      });

      expect(result.skipped).toEqual([]);
      expect(result.updated).toEqual(
        expect.arrayContaining([
          'convex/lib/crpc.ts',
          'src/lib/convex/convex-provider.tsx',
          'src/lib/convex/server.ts',
        ])
      );
    } finally {
      process.chdir(oldCwd);
    }
  });

  test('prompts before replacing user-edited integration files', async () => {
    const dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-owner-'))
    );
    const oldCwd = process.cwd();
    process.chdir(dir);

    try {
      const params = writeNextAuthProject(dir, { userEdits: true });
      const descriptor = getPluginCatalogEntry('auth');
      const files = descriptor.integration?.buildPlanFiles?.(params) ?? [];
      const prompts: string[] = [];

      await applyPluginInstallPlanFiles(files, {
        overwrite: false,
        yes: false,
        promptAdapter: {
          ...silentPromptAdapter,
          isInteractive: () => true,
          confirm: async (message: string) => {
            prompts.push(message);
            return false;
          },
        },
      });

      expect(prompts).toEqual(
        expect.arrayContaining([
          'Overwrite convex/lib/crpc.ts?',
          'Overwrite src/lib/convex/convex-provider.tsx?',
          'Overwrite src/lib/convex/server.ts?',
        ])
      );
    } finally {
      process.chdir(oldCwd);
    }
  });
});

describe('auth registry item', () => {
  test('claims jwks on first managed auth scaffold pass', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { convexTable, defineSchema, text } from 'kitcn/orm';

      export const messagesTable = convexTable('messages', {
        body: text().notNull(),
      });

      export const tables = {
        messages: messagesTable,
      };

      export default defineSchema(tables);
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {},
        },
        overwrite: false,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).toContain('export const jwksTable = convexTable(');
    expect(plan?.content).toContain('jwks: jwksTable,');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock).toEqual({
      path: schemaPath,
      tables: {
        account: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        jwks: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        session: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        user: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        verification: {
          checksum: expect.any(String),
          owner: 'managed',
        },
      },
    });
  });

  test('keeps local auth tables and still adds missing jwks table', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { convexTable, defineSchema, text } from 'kitcn/orm';

      export const accountTable = convexTable('account', {
        userId: text(),
      });
      export const sessionTable = convexTable('session', {
        userId: text(),
      });
      export const userTable = convexTable('user', {
        email: text(),
      });
      export const verificationTable = convexTable('verification', {
        identifier: text(),
      });

      const schema = defineSchema({
        account: accountTable,
        session: sessionTable,
        user: userTable,
        verification: verificationTable,
      });

      export default schema;
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {},
        },
        overwrite: false,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => true,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: false,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).not.toContain('authExtension()');
    expect(plan?.content).toContain('export const jwksTable = convexTable(');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock).toEqual({
      path: schemaPath,
      tables: {
        account: {
          owner: 'local',
        },
        jwks: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        session: {
          owner: 'local',
        },
        user: {
          owner: 'local',
        },
        verification: {
          owner: 'local',
        },
      },
    });
  });

  test('schema-only auth claim keeps forked local tables when no schema lock exists yet', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { convexTable, defineSchema, text } from 'kitcn/orm';

      export const accountTable = convexTable('account', {
        userId: text(),
      });
      export const sessionTable = convexTable('session', {
        userId: text(),
      });
      export const userTable = convexTable('user', {
        email: text(),
        bio: text(),
      });
      export const verificationTable = convexTable('verification', {
        identifier: text(),
      });

      const schema = defineSchema({
        account: accountTable,
        session: sessionTable,
        user: userTable,
        verification: verificationTable,
      });

      export default schema;
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        applyScope: 'schema',
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {},
        },
        overwrite: false,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => {
            throw new Error('should not prompt');
          },
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).toContain('export const jwksTable = convexTable(');
    expect(plan?.content).toContain('bio: text(),');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock).toEqual({
      path: schemaPath,
      tables: {
        account: {
          owner: 'local',
        },
        jwks: {
          checksum: expect.any(String),
          owner: 'managed',
        },
        session: {
          owner: 'local',
        },
        user: {
          owner: 'local',
        },
        verification: {
          owner: 'local',
        },
      },
    });
  });

  test('schema-only auth overwrite keeps explicitly local auth tables', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { convexTable, defineSchema, text } from 'kitcn/orm';

      export const accountTable = convexTable('account', {
        userId: text(),
      });
      export const jwksTable = convexTable('jwks', {
        publicKey: text(),
      });
      export const sessionTable = convexTable('session', {
        userId: text(),
      });
      export const userTable = convexTable('user', {
        email: text(),
        bio: text(),
      });
      export const verificationTable = convexTable('verification', {
        identifier: text(),
      });

      const schema = defineSchema({
        account: accountTable,
        jwks: jwksTable,
        session: sessionTable,
        user: userTable,
        verification: verificationTable,
      });

      export default schema;
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        applyScope: 'schema',
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {
            auth: {
              package: 'better-auth',
              schema: {
                path: schemaPath,
                tables: {
                  account: {
                    owner: 'local',
                  },
                  jwks: {
                    owner: 'local',
                  },
                  session: {
                    owner: 'local',
                  },
                  user: {
                    owner: 'local',
                  },
                  verification: {
                    owner: 'local',
                  },
                },
              },
            },
          },
        },
        overwrite: true,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => {
            throw new Error('should not prompt');
          },
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).toContain('bio: text(),');
    expect(plan?.content).toContain('name: text().notNull(),');
    expect(plan?.content).toContain('export const jwksTable = convexTable(');
    expect(plan?.content).toContain('privateKey: text().notNull(),');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock).toEqual({
      path: schemaPath,
      tables: {
        account: {
          owner: 'local',
        },
        jwks: {
          owner: 'local',
        },
        session: {
          owner: 'local',
        },
        user: {
          owner: 'local',
        },
        verification: {
          owner: 'local',
        },
      },
    });
  });

  test('schema-only auth reconcile forwards applyScope and replaces managed drift', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { convexTable, defineSchema, text } from "kitcn/orm";

      /* kitcn-managed auth:user:declaration:start */
      export const userTable = convexTable("user", {
        email: text(),
      });
      /* kitcn-managed auth:user:declaration:end */

      export const tables = {
      /* kitcn-managed auth:user:registration:start */
        user: userTable,
      /* kitcn-managed auth:user:registration:end */
      };

      export default defineSchema(tables);
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        applyScope: 'schema',
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {
            auth: {
              package: 'better-auth',
              schema: {
                path: schemaPath,
                tables: {
                  user: {
                    checksum: 'badbadbadbad',
                    owner: 'managed',
                  },
                },
              },
            },
          },
        },
        overwrite: false,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).toContain('export const userTable = convexTable(');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock?.tables.user).toEqual({
      checksum: expect.any(String),
      owner: 'managed',
    });
  });

  test('schema-only auth reconcile claims existing auth tables when no schema lock exists yet', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const authUnits = await renderManagedAuthSchemaUnits({
      authOptions: await loadDefaultManagedAuthOptions(),
    });
    const userUnit = authUnits.find((unit) => unit.key === 'user');
    if (!userUnit?.relations) {
      throw new Error('expected generated user auth schema unit');
    }
    const schemaSource = `
      import { boolean, convexTable, defineSchema, index, text, timestamp } from "kitcn/orm";

      ${userUnit.declaration}

      export const tables = {
${userUnit.registration}
      };

      export default defineSchema(tables).relations((r) => ({
${userUnit.relations},
      }));
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        applyScope: 'schema',
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {},
        },
        overwrite: false,
        preset: 'default',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(plan).toBeDefined();
    expect(plan?.action).toBe('update');
    expect(plan?.content).toContain('export const userTable = convexTable(');
    expect(plan?.content).not.toContain('kitcn-managed');
    expect(plan?.schemaOwnershipLock?.tables.user).toEqual({
      checksum: expect.any(String),
      owner: 'managed',
    });
  });

  test('convex auth schema registration reuses existing double-quoted authSchema import', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const functionsDir = path.join(dir, 'convex', 'functions');
    const schemaPath = path.join(functionsDir, 'schema.ts');
    const schemaSource = `
      import { authSchema } from "./authSchema";
      import { defineSchema } from "convex/server";

      export default defineSchema({
        messages: {},
      });
    `.trim();

    fs.mkdirSync(functionsDir, { recursive: true });
    fs.writeFileSync(schemaPath, schemaSource, 'utf8');

    const descriptor = getPluginCatalogEntry('auth');
    const plan =
      await descriptor.integration?.buildSchemaRegistrationPlanFile?.({
        config: createDefaultConfig(),
        functionsDir,
        lockfile: {
          plugins: {},
        },
        overwrite: true,
        preset: 'convex',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: null,
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: functionsDir,
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: null,
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

    expect(
      plan?.content.match(
        /import \{ authSchema \} from ['"]\.\/authSchema['"];/g
      )
    ).toHaveLength(1);
    expect(plan?.content).toContain(
      'import { authSchema } from "./authSchema";'
    );
    expect(plan?.content).toContain('...authSchema,');
  });

  test('raw Convex Start auth adoption does not require kitcn provider file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kitcn-auth-item-'));
    const oldCwd = process.cwd();
    process.chdir(dir);

    try {
      const descriptor = getPluginCatalogEntry('auth');
      const files = descriptor.integration?.buildPlanFiles?.({
        config: createDefaultConfig(),
        functionsDir: path.join(dir, 'convex', 'functions'),
        lockfile: { plugins: {} },
        overwrite: true,
        preset: 'convex',
        preview: false,
        promptAdapter: {
          confirm: async () => false,
          isInteractive: () => false,
          multiselect: async () => [],
          select: async () => 'ignored',
        },
        roots: {
          appRootDir: null,
          clientLibRootDir: path.join(dir, 'src', 'lib'),
          crpcFilePath: path.join(dir, 'convex', 'lib', 'crpc.ts'),
          envFilePath: path.join(dir, 'convex', 'lib', 'get-env.ts'),
          functionsRootDir: path.join(dir, 'convex', 'functions'),
          libRootDir: path.join(dir, 'convex', 'lib'),
          projectContext: {
            appDir: 'src',
            clientEntryFile: null,
            componentsDir: 'src/components',
            convexClientDir: 'src/lib/convex',
            framework: 'tanstack-start',
            mode: 'react',
          },
          sharedApiFilePath: path.join(dir, 'convex', 'shared', 'api.ts'),
        },
        yes: true,
      });

      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'skip',
            manualActions: expect.arrayContaining([
              expect.stringContaining('src/lib/convex/convex-provider.tsx'),
            ]),
            path: 'src/lib/convex/convex-provider.tsx',
          }),
        ])
      );
    } finally {
      process.chdir(oldCwd);
    }
  });
});
