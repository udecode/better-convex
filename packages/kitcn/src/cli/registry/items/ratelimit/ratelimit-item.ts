import fs from 'node:fs';
import { defineInternalRegistryItem } from '../../define-item.js';
import { createRegistryFile } from '../../files.js';
import { INIT_CRPC_TEMPLATE } from '../../init/init-crpc.template.js';
import {
  createPlanFile,
  getCrpcFilePath,
  renderInitTemplateContent,
} from '../../plan-helpers.js';
import type { PluginRegistryBuildPlanFilesParams } from '../../types.js';
import { patchRatelimitCrpcSource } from './ratelimit-crpc.js';
import { RATELIMIT_FUNCTIONS_TEMPLATE } from './ratelimit-functions.template.js';
import { RATELIMIT_PLUGIN_TEMPLATE } from './ratelimit-plugin.template.js';
import { RATELIMIT_SCHEMA_TEMPLATE } from './ratelimit-schema.template.js';

const RATELIMIT_FILES = [
  createRegistryFile({
    id: 'ratelimit-schema',
    path: 'schema.ts',
    target: 'lib',
    content: RATELIMIT_SCHEMA_TEMPLATE,
  }),
  createRegistryFile({
    id: 'ratelimit-functions',
    path: 'ratelimit.ts',
    target: 'functions',
    content: RATELIMIT_FUNCTIONS_TEMPLATE,
    requires: ['ratelimit-schema'],
  }),
  createRegistryFile({
    id: 'ratelimit-plugin',
    path: 'plugin.ts',
    target: 'lib',
    content: RATELIMIT_PLUGIN_TEMPLATE,
    requires: ['ratelimit-schema'],
  }),
] as const;

function buildRatelimitCrpcRegistrationPlanFile(
  params: PluginRegistryBuildPlanFilesParams
) {
  const crpcPath = getCrpcFilePath(params.config);
  const baselineCrpcSource = renderInitTemplateContent({
    template: INIT_CRPC_TEMPLATE,
    filePath: crpcPath,
    functionsDir: params.functionsDir,
    crpcFilePath: crpcPath,
  });
  const source = patchRatelimitCrpcSource(
    fs.existsSync(crpcPath)
      ? fs.readFileSync(crpcPath, 'utf8')
      : baselineCrpcSource
  );

  return createPlanFile({
    kind: 'scaffold',
    filePath: crpcPath,
    content: source,
    managedBaselineContent: baselineCrpcSource,
    // Patches the existing source in place, so it never clobbers user code.
    requiresExplicitOverwrite: false,
    createReason: 'Create crpc.ts with ratelimit middleware.',
    updateReason: 'Register ratelimit middleware in crpc.ts.',
    skipReason: 'Ratelimit middleware is already registered in crpc.ts.',
  });
}

export const ratelimitRegistryItem = defineInternalRegistryItem({
  item: {
    name: 'ratelimit',
    type: 'registry:item',
    title: 'Ratelimit',
    description:
      'Reusable server-side rate limiting plugin with schema-backed buckets.',
    categories: ['ratelimit', 'rate-limit', 'throttle'],
    docs: 'https://kitcn.vercel.app/docs/plugins/ratelimit',
    dependencies: ['kitcn'],
    files: RATELIMIT_FILES,
  },
  internal: {
    localDocsPath: 'www/content/docs/plugins/ratelimit.mdx',
    schemaRegistration: {
      importName: 'ratelimitExtension',
      path: 'schema.ts',
      target: 'lib',
    },
    defaultPreset: 'server-first',
    presets: [
      {
        name: 'server-first',
        description:
          'Scaffold a reusable ratelimit plugin and auto-register schema extension.',
        registryDependencies: RATELIMIT_FILES.map((file) => file.meta.id),
      },
      {
        name: 'schema-only',
        description: 'Only register ratelimit extension in schema.',
        registryDependencies: ['ratelimit-schema'],
      },
    ],
    integration: {
      buildPlanFiles: (params) => [
        buildRatelimitCrpcRegistrationPlanFile(params),
      ],
    },
  },
});
