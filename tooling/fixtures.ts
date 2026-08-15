import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import {
  createLoggedRun,
  generateFreshApp,
  getLocalInstallSpec,
  installLocalPackage,
  log,
  mapWithConcurrency,
  normalizeEnvLocal,
  PROJECT_ROOT,
  patchPreparedLocalDevPort,
  readJson,
  run,
  runAppValidation,
  runLocalCliSteps,
  stripVolatileArtifacts,
  type WorkspacePackageJson,
  writeJson,
} from './scaffold-utils';
import {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_KEYS,
  type TemplateBackend,
  type TemplateKey,
} from './template.config';

export type TemplateTarget = 'all' | TemplateKey;
export type FixtureCheckScope = 'owned' | 'full';

const VALID_TEMPLATE_BACKENDS = new Set(['convex', 'concave'] as const);
const VALID_FIXTURE_CHECK_SCOPES = new Set(['owned', 'full'] as const);
const DEFAULT_FIXTURE_CHECK_SCOPE = 'owned' satisfies FixtureCheckScope;
const FIXTURE_CONCURRENCY_ENV = 'KITCN_FIXTURE_CONCURRENCY';
const DEFAULT_FIXTURE_CONCURRENCY = 4;

type TemplateFailure = {
  error: unknown;
  templateKey: TemplateKey;
};

export class FixtureDriftError extends Error {
  readonly templateKey: TemplateKey;

  constructor(templateKey: TemplateKey) {
    super(`Fixture drift detected for ${templateKey}.`);
    this.name = 'FixtureDriftError';
    this.templateKey = templateKey;
  }
}

const describeTemplateFailure = ({ error, templateKey }: TemplateFailure) => {
  const message = error instanceof Error ? error.message : String(error);

  return `  - ${templateKey}: ${message}`;
};

const isDriftFailure = (failure: TemplateFailure) =>
  failure.error instanceof FixtureDriftError;

export class TemplateFailuresError extends Error {
  readonly failures: readonly TemplateFailure[];

  constructor(failures: readonly TemplateFailure[], total: number) {
    const lines = [
      `${failures.length} of ${total} templates failed:`,
      ...failures.map(describeTemplateFailure),
    ];

    if (failures.some(isDriftFailure)) {
      lines.push(
        'Run `bun run fixtures:sync` and commit the updated snapshots.'
      );
    }

    super(lines.join('\n'));
    this.name = 'TemplateFailuresError';
    this.failures = failures;
  }
}

const getTemplateFixtureDir = (templateKey: TemplateKey) =>
  path.join(PROJECT_ROOT, 'fixtures', templateKey);

const getFixturePackageName = (templateKey: TemplateKey) =>
  `kitcn-template-${templateKey}`;

const getValidationPackageName = (templateKey: TemplateKey) =>
  `${getFixturePackageName(templateKey)}-check`;

const getGeneratedAppName = (templateKey: TemplateKey) =>
  TEMPLATE_DEFINITIONS[templateKey].initTemplate === 'expo'
    ? 'kitcn-expo'
    : TEMPLATE_DEFINITIONS[templateKey].initTemplate;

const FIXTURE_TSCONFIG_FILES = [
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  path.join('convex', 'functions', 'tsconfig.json'),
  path.join('convex', 'tsconfig.json'),
] as const;

const FIXTURE_PACKAGE_PATHS = {
  'kitcn/aggregate': 'src/aggregate/index.ts',
  'kitcn/auth': 'src/auth/index.ts',
  'kitcn/auth/client': 'src/auth-client/index.ts',
  'kitcn/auth/config': 'src/auth-config/index.ts',
  'kitcn/auth/generated': 'src/auth/generated.ts',
  'kitcn/auth/http': 'src/auth-http/index.ts',
  'kitcn/auth/nextjs': 'src/auth-nextjs/index.ts',
  'kitcn/auth/start': 'src/auth-start/index.ts',
  'kitcn/auth/start/server': 'src/auth-start/server.ts',
  'kitcn/crpc': 'src/crpc/index.ts',
  'kitcn/orm': 'src/orm/index.ts',
  'kitcn/plugins': 'src/plugins/index.ts',
  'kitcn/ratelimit': 'src/ratelimit/index.ts',
  'kitcn/ratelimit/react': 'src/ratelimit/react/index.ts',
  'kitcn/react': 'src/react/index.ts',
  'kitcn/rsc': 'src/rsc/index.ts',
  'kitcn/server': 'src/server/index.ts',
  'kitcn/solid': 'src/solid/index.ts',
} as const;

const VOLATILE_FIXTURE_DEPENDENCY_SPECS = {
  shadcn: 'latest',
} as const;

const VOLATILE_FIXTURE_COMPARISON_DIRS = [
  path.join('components', 'ui'),
  path.join('src', 'components', 'ui'),
] as const;

const SHADCN_TEMPLATE_KEYS = new Set<TemplateKey>([
  'next',
  'next-auth',
  'start',
  'start-auth',
  'vite',
  'vite-auth',
]);

const getProjectPackageManager = () =>
  readJson<WorkspacePackageJson>(path.join(PROJECT_ROOT, 'package.json'))
    .packageManager;

const normalizeTemplatePackageJson = (
  packageJson: WorkspacePackageJson,
  templateKey: TemplateKey
): WorkspacePackageJson => ({
  dependencies: {
    ...packageJson.dependencies,
    kitcn: 'workspace:*',
    ...Object.fromEntries(
      Object.entries(VOLATILE_FIXTURE_DEPENDENCY_SPECS).filter(
        ([dependencyName]) => packageJson.dependencies?.[dependencyName]
      )
    ),
  },
  main: packageJson.main,
  devDependencies: packageJson.devDependencies,
  name: getFixturePackageName(templateKey),
  packageManager: getProjectPackageManager(),
  private: packageJson.private ?? true,
  scripts: packageJson.scripts,
  type: packageJson.type,
  version: packageJson.version,
});

const stripFixtureSnapshotArtifacts = (directory: string) => {
  rmSync(path.join(directory, '.env.local'), { force: true });
};

export const stripFixtureComparisonArtifacts = (
  directory: string,
  templateKey: TemplateKey,
  scope: FixtureCheckScope = DEFAULT_FIXTURE_CHECK_SCOPE
) => {
  stripFixtureSnapshotArtifacts(directory);

  if (scope === 'full' || !SHADCN_TEMPLATE_KEYS.has(templateKey)) {
    return;
  }

  for (const relativeDir of VOLATILE_FIXTURE_COMPARISON_DIRS) {
    rmSync(path.join(directory, relativeDir), {
      force: true,
      recursive: true,
    });
  }
};

export const normalizeFixtureComparisonPackageJson = (directory: string) => {
  const packageJsonPath = path.join(directory, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = readJson<WorkspacePackageJson>(packageJsonPath);
  const packageManager = getProjectPackageManager();
  const {
    dependencies,
    devDependencies,
    main,
    name,
    packageManager: _packageManager,
    private: isPrivate,
    scripts,
    type,
    version,
    ...rest
  } = packageJson;

  writeJson(packageJsonPath, {
    dependencies,
    main,
    devDependencies,
    name,
    packageManager,
    private: isPrivate,
    scripts,
    type,
    version,
    ...rest,
  });
};

export const normalizeTemplateSnapshot = (
  directory: string,
  templateKey: TemplateKey
) => {
  stripVolatileArtifacts(directory);
  writeJson(
    path.join(directory, 'package.json'),
    normalizeTemplatePackageJson(
      readJson<WorkspacePackageJson>(path.join(directory, 'package.json')),
      templateKey
    )
  );
  normalizeEnvLocal(directory);
  patchPreparedLocalDevPort(directory);
  patchFixtureTsconfigPaths(directory, getTemplateFixtureDir(templateKey));
  stripFixtureSnapshotArtifacts(directory);
};

type TsconfigJson = {
  compilerOptions?: {
    paths?: Record<string, string[]>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const patchFixtureTsconfigPaths = (
  directory: string,
  snapshotDirectory: string
) => {
  for (const relativeTsconfigPath of FIXTURE_TSCONFIG_FILES) {
    const tsconfigPath = path.join(directory, relativeTsconfigPath);
    if (!existsSync(tsconfigPath)) {
      continue;
    }

    const parsedTsconfig = ts.parseConfigFileTextToJson(
      tsconfigPath,
      readFileSync(tsconfigPath, 'utf8')
    );
    if (parsedTsconfig.error) {
      throw new Error(
        `Failed to parse ${path.relative(PROJECT_ROOT, tsconfigPath)}.`
      );
    }
    const tsconfig = (parsedTsconfig.config ?? {}) as TsconfigJson;
    const compilerOptions = tsconfig.compilerOptions ?? {};
    const paths = compilerOptions.paths ?? {};
    const snapshotTsconfigDir = path.dirname(
      path.join(snapshotDirectory, relativeTsconfigPath)
    );

    for (const [specifier, sourcePath] of Object.entries(
      FIXTURE_PACKAGE_PATHS
    )) {
      const relativeSourcePath = path
        .relative(
          snapshotTsconfigDir,
          path.join(PROJECT_ROOT, 'packages', 'kitcn', sourcePath)
        )
        .replaceAll(path.sep, '/');
      paths[specifier] = [
        relativeSourcePath.startsWith('.')
          ? relativeSourcePath
          : `./${relativeSourcePath}`,
      ];
    }

    writeJson(tsconfigPath, {
      ...tsconfig,
      compilerOptions: {
        ...compilerOptions,
        paths,
      },
    });
  }
};

export const parseTemplateArgs = (
  argv: string[]
): {
  backend: TemplateBackend;
  mode: 'sync' | 'check';
  scope: FixtureCheckScope;
  target: TemplateTarget;
} => {
  const [mode, ...rest] = argv;
  if (mode !== 'sync' && mode !== 'check') {
    throw new Error(
      'Usage: bun tooling/fixtures.ts <sync|check> [all|expo|expo-auth|next|next-auth|start|start-auth|vite|vite-auth] [--backend <convex|concave>]'
    );
  }

  let backend: TemplateBackend = 'concave';
  let scope = DEFAULT_FIXTURE_CHECK_SCOPE;
  let target: TemplateTarget = 'all';

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === '--backend') {
      const value = rest[index + 1];
      if (!value || !VALID_TEMPLATE_BACKENDS.has(value as TemplateBackend)) {
        throw new Error(
          `Invalid --backend value "${value ?? ''}". Expected one of: convex, concave.`
        );
      }
      backend = value as TemplateBackend;
      index += 1;
      continue;
    }

    if (arg === '--scope') {
      const value = rest[index + 1];
      if (
        !value ||
        !VALID_FIXTURE_CHECK_SCOPES.has(value as FixtureCheckScope)
      ) {
        throw new Error(
          `Invalid --scope value "${value ?? ''}". Expected one of: owned, full.`
        );
      }
      scope = value as FixtureCheckScope;
      index += 1;
      continue;
    }

    if (arg === 'all' || TEMPLATE_KEYS.includes(arg as TemplateKey)) {
      target = arg as TemplateTarget;
      continue;
    }

    throw new Error(`Unknown template target "${arg}".`);
  }

  return { backend, mode, scope, target };
};

export const resolveTemplateKeys = (target: TemplateTarget = 'all') =>
  target === 'all' ? [...TEMPLATE_KEYS] : [target];

export const generateTemplate = async (
  templateKey: TemplateKey,
  params: {
    backend?: TemplateBackend;
    localCliPath?: string;
    projectRoot?: string;
    runCommand?: typeof run;
  } = {}
) => {
  const definition = TEMPLATE_DEFINITIONS[templateKey];
  const backend = params.backend ?? 'concave';
  const generatedAppName = getGeneratedAppName(templateKey);
  const runCommand = params.runCommand ?? run;
  const { generatedAppDir, tempRoot } = await generateFreshApp({
    backend,
    generatedAppName,
    initTemplate: definition.initTemplate,
    localCliPath: params.localCliPath,
    projectRoot: params.projectRoot,
    runCommand,
  });

  await runLocalCliSteps(definition.setup, generatedAppDir, {
    backend,
    localCliPath: params.localCliPath,
    runCommand,
  });

  return { generatedAppDir, tempRoot };
};

export const syncTemplate = async (
  templateKey: TemplateKey,
  params: {
    backend?: TemplateBackend;
    generateTemplateFn?: typeof generateTemplate;
    installLocalPackageFn?: typeof installLocalPackage;
    logFn?: typeof log;
    normalizeTemplateFn?: typeof normalizeTemplateSnapshot;
    runCommand?: typeof run;
    validateAppFn?: typeof runAppValidation;
  } = {}
) => {
  const generateTemplateFn = params.generateTemplateFn ?? generateTemplate;
  const normalizeTemplateFn =
    params.normalizeTemplateFn ?? normalizeTemplateSnapshot;
  const runCommand = params.runCommand ?? run;
  const fixtureDir = getTemplateFixtureDir(templateKey);
  const { generatedAppDir, tempRoot } = await generateTemplateFn(templateKey, {
    backend: params.backend,
    runCommand,
  });

  try {
    await (params.installLocalPackageFn ?? installLocalPackage)(
      generatedAppDir,
      {
        kitcnPackageSpec: getLocalInstallSpec(),
        runCommand,
      }
    );
    await (params.validateAppFn ?? runAppValidation)(
      generatedAppDir,
      runCommand,
      {
        lint: TEMPLATE_DEFINITIONS[templateKey].validation.lint,
      }
    );
    normalizeTemplateFn(generatedAppDir, templateKey);
    mkdirSync(path.dirname(fixtureDir), { recursive: true });
    rmSync(fixtureDir, { recursive: true, force: true });
    cpSync(generatedAppDir, fixtureDir, { recursive: true });
    (params.logFn ?? log)(`Synced ${path.relative(PROJECT_ROOT, fixtureDir)}.`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

const resolveFixtureConcurrency = () => {
  const raw = process.env[FIXTURE_CONCURRENCY_ENV];
  if (!raw) {
    return DEFAULT_FIXTURE_CONCURRENCY;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `Invalid ${FIXTURE_CONCURRENCY_ENV} value "${raw}". Expected a positive integer.`
    );
  }

  return parsed;
};

const flushTemplateLog = (templateKey: TemplateKey, logFile: string) => {
  const contents = existsSync(logFile)
    ? readFileSync(logFile, 'utf8').trimEnd()
    : '';

  log(`----- ${templateKey} -----`);
  if (contents.length > 0) {
    log(contents);
  }
};

/**
 * Templates share no mutable state — each one scaffolds into its own
 * `mkdtempSync` root — so they run through a bounded pool instead of serially.
 * Every template's subprocess output is captured to its own log file and
 * flushed on completion so concurrent runs stay attributable, and failures are
 * collected so one run reports every broken template instead of aborting at the
 * first.
 */
const runTemplates = async (
  templateKeys: readonly TemplateKey[],
  runTemplate: (
    templateKey: TemplateKey,
    io: { logFn: typeof log; runCommand: typeof run }
  ) => Promise<void>
) => {
  const concurrency = resolveFixtureConcurrency();
  const workerCount = Math.min(concurrency, templateKeys.length);
  const logRoot = mkdtempSync(path.join(tmpdir(), 'kitcn-fixture-logs-'));
  const failures: TemplateFailure[] = [];

  log(
    `Running ${templateKeys.length} templates with concurrency ${workerCount}.`
  );

  try {
    await mapWithConcurrency(templateKeys, concurrency, async (templateKey) => {
      const logFile = path.join(logRoot, `${templateKey}.log`);

      try {
        await runTemplate(templateKey, {
          logFn: (message: string) => {
            appendFileSync(logFile, `${message}\n`);
          },
          runCommand: createLoggedRun(logFile),
        });
      } catch (error) {
        failures.push({ error, templateKey });
      } finally {
        flushTemplateLog(templateKey, logFile);
      }
    });
  } finally {
    rmSync(logRoot, { force: true, recursive: true });
  }

  if (failures.length > 0) {
    throw new TemplateFailuresError(failures, templateKeys.length);
  }
};

export const syncTemplates = async (
  params: {
    backend?: TemplateBackend;
    syncTemplateFn?: typeof syncTemplate;
    target?: TemplateTarget;
  } = {}
) => {
  const syncTemplateFn = params.syncTemplateFn ?? syncTemplate;

  await runTemplates(resolveTemplateKeys(params.target), (templateKey, io) =>
    syncTemplateFn(templateKey, {
      backend: params.backend,
      logFn: io.logFn,
      runCommand: io.runCommand,
    })
  );
};

export const checkTemplate = async (
  templateKey: TemplateKey,
  params: {
    backend?: TemplateBackend;
    generateTemplateFn?: typeof generateTemplate;
    logFn?: typeof log;
    normalizeTemplateFn?: typeof normalizeTemplateSnapshot;
    projectRoot?: string;
    runCommand?: typeof run;
    scope?: FixtureCheckScope;
    validateAppFn?: typeof runAppValidation;
  } = {}
) => {
  const fixtureDir = getTemplateFixtureDir(templateKey);
  if (!existsSync(fixtureDir)) {
    throw new Error(
      `${path.relative(PROJECT_ROOT, fixtureDir)} is missing. Run \`bun run fixtures:sync\` first.`
    );
  }

  const generateTemplateFn = params.generateTemplateFn ?? generateTemplate;
  const normalizeTemplateFn =
    params.normalizeTemplateFn ?? normalizeTemplateSnapshot;
  const runCommand = params.runCommand ?? run;
  const { generatedAppDir, tempRoot } = await generateTemplateFn(templateKey, {
    backend: params.backend ?? 'concave',
    runCommand,
  });

  try {
    await installLocalPackage(generatedAppDir, {
      kitcnPackageSpec: getLocalInstallSpec(),
      packageName: getValidationPackageName(templateKey),
      runCommand,
    });
    await (params.validateAppFn ?? runAppValidation)(
      generatedAppDir,
      runCommand,
      {
        lint: TEMPLATE_DEFINITIONS[templateKey].validation.lint,
      }
    );
    normalizeTemplateFn(generatedAppDir, templateKey);

    const fixtureDiffDir = path.join(tempRoot, '__fixture__');
    cpSync(fixtureDir, fixtureDiffDir, { recursive: true });
    stripVolatileArtifacts(fixtureDiffDir);
    normalizeFixtureComparisonPackageJson(fixtureDiffDir);
    stripFixtureComparisonArtifacts(
      fixtureDiffDir,
      templateKey,
      params.scope ?? DEFAULT_FIXTURE_CHECK_SCOPE
    );
    stripFixtureComparisonArtifacts(
      generatedAppDir,
      templateKey,
      params.scope ?? DEFAULT_FIXTURE_CHECK_SCOPE
    );

    const diffExitCode = await runCommand(
      [
        'git',
        '--no-pager',
        'diff',
        '--no-index',
        '--no-ext-diff',
        '--',
        fixtureDiffDir,
        generatedAppDir,
      ],
      params.projectRoot ?? PROJECT_ROOT,
      {
        allowNonZeroExit: true,
      }
    );

    if (diffExitCode === 0) {
      (params.logFn ?? log)(TEMPLATE_DEFINITIONS[templateKey].successMessage);
      return;
    }

    if (diffExitCode === 1) {
      throw new FixtureDriftError(templateKey);
    }

    throw new Error(
      `git diff --no-index failed with exit code ${diffExitCode} for ${templateKey}.`
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

export const checkTemplates = async (
  params: {
    backend?: TemplateBackend;
    checkTemplateFn?: typeof checkTemplate;
    scope?: FixtureCheckScope;
    target?: TemplateTarget;
  } = {}
) => {
  const checkTemplateFn = params.checkTemplateFn ?? checkTemplate;

  await runTemplates(resolveTemplateKeys(params.target), (templateKey, io) =>
    checkTemplateFn(templateKey, {
      backend: params.backend,
      logFn: io.logFn,
      runCommand: io.runCommand,
      scope: params.scope ?? DEFAULT_FIXTURE_CHECK_SCOPE,
    })
  );
};

const main = async () => {
  const { backend, mode, scope, target } = parseTemplateArgs(
    process.argv.slice(2)
  );

  if (mode === 'sync') {
    await syncTemplates({ backend, target });
    return;
  }

  await checkTemplates({ backend, scope, target });
};

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    if (error instanceof TemplateFailuresError) {
      log(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}
