import type * as tsType from 'typescript';
import { createTypeScriptProxy } from '../utils/typescript-runtime.js';
import { parseSchemaSource } from './schema-parse.js';

const ts = createTypeScriptProxy();

export type SchemaChainCall = {
  /** Index of the matching `)` of this call. */
  closeParenIndex: number;
  /** Index of the leading `.` that starts `.name(`. */
  dotIndex: number;
  /** Index just past the matching `)` of this call. */
  end: number;
  /** Method name, e.g. `extend`, `relations`, `triggers`. */
  name: string;
};

export type SchemaChain = {
  /** Calls chained onto `defineSchema(...)`, in source order. */
  calls: SchemaChainCall[];
  /** Index just past the `)` that closes `defineSchema(...)`. */
  defineSchemaEnd: number;
};

const isDefineSchemaCall = (
  node: tsType.Node
): node is tsType.CallExpression => {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text === 'defineSchema';
  }
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'defineSchema'
  );
};

const findDefineSchemaCall = (
  sourceFile: tsType.SourceFile
): tsType.CallExpression | null => {
  let found: tsType.CallExpression | null = null;

  const visit = (node: tsType.Node) => {
    if (found) {
      return;
    }
    if (isDefineSchemaCall(node)) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
};

/**
 * Resolve the real `defineSchema(...)` call and the methods chained onto it.
 *
 * Locating the call through the TypeScript AST is what keeps registration out
 * of comments and string literals that merely mention `defineSchema(`.
 */
export const findDefineSchemaChain = (source: string): SchemaChain | null => {
  const sourceFile = parseSchemaSource(source);
  const defineSchemaCall = findDefineSchemaCall(sourceFile);
  if (!defineSchemaCall) {
    return null;
  }

  const calls: SchemaChainCall[] = [];
  let current: tsType.Node = defineSchemaCall;

  while (
    current.parent &&
    ts.isPropertyAccessExpression(current.parent) &&
    current.parent.expression === current &&
    current.parent.parent &&
    ts.isCallExpression(current.parent.parent) &&
    current.parent.parent.expression === current.parent
  ) {
    const propertyAccess = current.parent;
    const call = current.parent.parent;
    const dotToken = propertyAccess
      .getChildren(sourceFile)
      .find((child) => child.kind === ts.SyntaxKind.DotToken);
    if (!dotToken) {
      throw new Error('Schema chain property access is missing its dot token.');
    }
    calls.push({
      closeParenIndex: call.end - 1,
      dotIndex: dotToken.getStart(sourceFile),
      end: call.end,
      name: propertyAccess.name.text,
    });
    current = call;
  }

  return { calls, defineSchemaEnd: defineSchemaCall.end };
};

/**
 * Whether `source` really calls `name()` somewhere, ignoring comments and
 * string literals.
 */
export const hasCallExpression = (source: string, name: string): boolean => {
  const sourceFile = parseSchemaSource(source);
  let found = false;

  const visit = (node: tsType.Node) => {
    if (found) {
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
};
