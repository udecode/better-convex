import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { CRPC_BUILDER_STUB_SOURCE } from './crpc-builder-stub.js';
import { loadJiti } from './lazy-deps.js';

const require = createRequire(import.meta.url);

type TypeScriptModule = {
  findConfigFile: (
    searchPath: string,
    fileExists: (fileName: string) => boolean,
    configName: string
  ) => string | undefined;
  parseJsonConfigFileContent: (
    json: unknown,
    host: {
      readDirectory: (...args: any[]) => string[];
      fileExists: (path: string) => boolean;
      readFile: (path: string) => string | undefined;
      useCaseSensitiveFileNames: boolean;
      trace?: (s: string) => void;
      onUnRecoverableConfigFileDiagnostic?: (diagnostic: unknown) => void;
    },
    basePath: string
  ) => {
    options: {
      baseUrl?: string;
      paths?: Record<string, string[]>;
    };
  };
  readConfigFile: (
    fileName: string,
    readFile: (path: string) => string | undefined
  ) => {
    config: unknown;
    error?: unknown;
  };
  sys: {
    fileExists: (path: string) => boolean;
    readFile: (path: string) => string | undefined;
    readDirectory: (...args: any[]) => string[];
    useCaseSensitiveFileNames: boolean;
  };
};

type JitiExportTarget =
  | string
  | { [key: string]: JitiExportTarget }
  | JitiExportTarget[];

const JITI_EXPORT_CONDITION_PRIORITY = [
  'bun',
  'import',
  'module',
  'default',
  'require',
] as const;

const SERVER_PARSER_SHIM_SOURCE = `${CRPC_BUILDER_STUB_SOURCE}

export class CRPCError extends Error {
  constructor(options = {}) {
    super(options.message ?? options.code ?? "CRPC error");
    this.code = options.code;
  }
}

const parseEnvForCodegen = (schema) => {
  if (typeof schema?.safeParse !== "function") {
    return schema.parse(process.env);
  }

  const result = schema.safeParse(process.env);
  if (result?.success === true) return result.data;

  const issues = result?.error?.issues;
  if (!Array.isArray(issues) || issues.length === 0) {
    return schema.parse(process.env);
  }

  const missingFieldIssues = new Map();
  for (const [key, field] of Object.entries(schema.shape)) {
    if (
      process.env[key] !== undefined ||
      typeof field?.safeParse !== "function"
    ) {
      continue;
    }
    const fieldResult = field.safeParse(undefined);
    if (
      fieldResult?.success === false &&
      Array.isArray(fieldResult.error?.issues)
    ) {
      missingFieldIssues.set(key, fieldResult.error.issues);
    }
  }

  const isMissingFieldIssue = (issue) => {
    if (!Array.isArray(issue?.path) || issue.path.length === 0) return false;
    const [key, ...path] = issue.path;
    const fieldIssues = missingFieldIssues.get(key);
    return fieldIssues?.some(
      (fieldIssue) =>
        fieldIssue?.code === issue.code &&
        JSON.stringify(fieldIssue.path ?? []) === JSON.stringify(path)
    );
  };
  if (!issues.every(isMissingFieldIssue)) {
    return schema.parse(process.env);
  }

  const data = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    if (typeof field?.safeParse !== "function") {
      return schema.parse(process.env);
    }
    const fieldResult = field.safeParse(process.env[key]);
    if (fieldResult?.success === true) {
      data[key] = fieldResult.data;
    } else if (!missingFieldIssues.has(key)) {
      return schema.parse(process.env);
    }
  }
  return data;
};

export const createEnv = ({ schema }) => () => {
  if (typeof schema?.parse !== "function") return process.env;
  if (globalThis.__KITCN_CODEGEN__ !== true || !schema.shape) {
    return schema.parse(process.env);
  }
  return parseEnvForCodegen(schema);
};
export const createHttpRouter = (_app, httpRouter) => httpRouter ?? {};
export const createCallerFactory = () => () => ({});
export const createApiLeaf = (fnOrRoot, pathOrMeta, maybeMeta) => {
  const meta = maybeMeta ?? pathOrMeta;
  const fn = Array.isArray(pathOrMeta)
    ? pathOrMeta.reduce((current, segment) => current?.[segment], fnOrRoot)
    : fnOrRoot;
  return Object.assign(fn ?? {}, meta ?? {}, { functionRef: fn });
};
export const createGeneratedFunctionReference = (name) => ({
  [Symbol.for("functionName")]: name,
});
export const registerProcedureNameLookup = () => {};
export const typedProcedureResolver = (_functionRef, resolver) => resolver;
export const createGeneratedRegistryRuntime = () => ({
  getCallerFactory() {
    return () => ({});
  },
  getHandlerFactory() {
    return () => ({});
  },
});
`;

const resolveJitiExportTarget = (target: unknown): string | null => {
  if (typeof target === 'string') {
    return target;
  }
  if (Array.isArray(target)) {
    for (const entry of target) {
      const resolved = resolveJitiExportTarget(entry);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }
  if (!target || typeof target !== 'object') {
    return null;
  }

  const record = target as Record<string, JitiExportTarget>;
  for (const condition of JITI_EXPORT_CONDITION_PRIORITY) {
    const resolved = resolveJitiExportTarget(record[condition]);
    if (resolved) {
      return resolved;
    }
  }
  for (const value of Object.values(record)) {
    const resolved = resolveJitiExportTarget(value);
    if (resolved) {
      return resolved;
    }
  }
  return null;
};

const buildLocalPackageExportAliases = (
  cwd: string,
  packageName: string
): Record<string, string> => {
  const packageDir = path.join(cwd, 'node_modules', ...packageName.split('/'));
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return {};
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    exports?: Record<string, JitiExportTarget> | JitiExportTarget;
  };
  const exportsField = packageJson.exports;
  if (
    !exportsField ||
    typeof exportsField !== 'object' ||
    Array.isArray(exportsField)
  ) {
    return {};
  }

  const aliases: Record<string, string> = {};
  for (const [exportKey, exportTarget] of Object.entries(exportsField)) {
    const resolvedTarget = resolveJitiExportTarget(exportTarget);
    if (!resolvedTarget || !resolvedTarget.startsWith('./')) {
      continue;
    }

    const specifier =
      exportKey === '.'
        ? packageName
        : exportKey.startsWith('./')
          ? `${packageName}${exportKey.slice(1)}`
          : null;
    if (!specifier) {
      continue;
    }

    aliases[specifier] = path.join(packageDir, resolvedTarget);
  }

  return aliases;
};

const ensureServerParserShim = (cwd: string): string => {
  const shimDir = path.join(cwd, 'node_modules', '.kitcn');
  const shimPath = path.join(shimDir, 'project-jiti-server-shim.mjs');
  fs.mkdirSync(shimDir, { recursive: true });
  if (
    !fs.existsSync(shimPath) ||
    fs.readFileSync(shimPath, 'utf8') !== SERVER_PARSER_SHIM_SOURCE
  ) {
    fs.writeFileSync(shimPath, SERVER_PARSER_SHIM_SOURCE, 'utf8');
  }
  return shimPath;
};

const trimTsconfigWildcardSuffix = (value: string) =>
  value.endsWith('/*') ? value.slice(0, -2) : value;

const loadTypeScript = (): TypeScriptModule | null => {
  try {
    return require('typescript') as TypeScriptModule;
  } catch {
    return null;
  }
};

const buildTsconfigPathAliases = (cwd: string): Record<string, string> => {
  const typescript = loadTypeScript();
  if (!typescript) {
    return {};
  }
  const configPath = typescript.findConfigFile(
    cwd,
    fs.existsSync,
    'tsconfig.json'
  );
  if (!configPath) {
    return {};
  }

  const readResult = typescript.readConfigFile(
    configPath,
    typescript.sys.readFile
  );
  if (readResult.error) {
    return {};
  }

  const parsedConfig = typescript.parseJsonConfigFileContent(
    readResult.config,
    typescript.sys,
    path.dirname(configPath)
  );
  const baseUrl =
    typeof parsedConfig.options.baseUrl === 'string' &&
    parsedConfig.options.baseUrl.length > 0
      ? parsedConfig.options.baseUrl
      : path.dirname(configPath);
  const paths = parsedConfig.options.paths;
  if (!paths) {
    return {};
  }

  const aliases: Record<string, string> = {};
  for (const [specifier, targets] of Object.entries(paths)) {
    const firstTarget = targets[0];
    if (!firstTarget) {
      continue;
    }

    const aliasKey = trimTsconfigWildcardSuffix(specifier);
    const aliasTarget = trimTsconfigWildcardSuffix(firstTarget);
    if (!aliasKey || aliasKey === '*') {
      continue;
    }

    aliases[aliasKey] = path.resolve(baseUrl, aliasTarget);
  }

  return aliases;
};

export const getProjectServerParserShimPath = (cwd = process.cwd()) =>
  ensureServerParserShim(cwd);

export const createProjectJiti = (cwd = process.cwd()) =>
  loadJiti().createJiti(cwd, {
    interopDefault: true,
    jsx: {
      runtime: 'automatic',
    },
    // jiti's runtime module cache is Node's process-global CJS cache. The
    // `kitcn dev` watcher is long-lived, so leaving it on without per-run
    // invalidation makes codegen blind to edits: a module imported once keeps
    // serving its first evaluation for the rest of the session. Turning it on
    // requires evicting every watchable project file (realpath outside
    // `node_modules`) at the start of each run.
    moduleCache: false,
    // Bun-native import bypasses Jiti aliasing for transitive project files.
    // Parse-time CLI imports need Jiti in the loop end-to-end.
    tryNative: false,
    alias: {
      ...buildTsconfigPathAliases(cwd),
      ...buildLocalPackageExportAliases(cwd, 'kitcn'),
      ...buildLocalPackageExportAliases(cwd, 'convex'),
      'kitcn/server': getProjectServerParserShimPath(cwd),
    },
  });
