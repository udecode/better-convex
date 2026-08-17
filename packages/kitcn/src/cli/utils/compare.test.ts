import { isContentEquivalent } from './content-compare';

describe('cli/utils/compare', () => {
  test('treats formatting-only TypeScript changes as equivalent', () => {
    const existingContent = `
      import { text } from 'kitcn/orm';

      export const resendContentTable = convexTable('resend_content', {
        path: text(),
      });
    `.trim();

    const nextContent = `
      import { text } from "kitcn/orm";

      export const resendContentTable = convexTable("resend_content", {
        path: text(),
      });
    `.trim();

    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/schema.ts',
        existingContent,
        nextContent,
      })
    ).toBe(true);
  });

  test('treats comment-only TypeScript changes as equivalent', () => {
    const existingContent = `
      import { ResendPlugin } from '@kitcn/resend';
      import { getEnv } from '../../get-env';

      export const resend = ResendPlugin.configure({
        apiKey: getEnv().RESEND_API_KEY,
        webhookSecret: getEnv().RESEND_WEBHOOK_SECRET,
        initialBackoffMs: 30_000,
        retryAttempts: 5,
        // testMode defaults to true. Set to false in production once your domain is ready.
        testMode: true,
      });
    `.trim();

    const nextContent = `
      import { ResendPlugin } from "@kitcn/resend";
      import { getEnv } from "../../get-env";

      export const resend = ResendPlugin.configure({
        apiKey: getEnv().RESEND_API_KEY,
        webhookSecret: getEnv().RESEND_WEBHOOK_SECRET,
        initialBackoffMs: 30_000,
        retryAttempts: 5,
        // Set to false in production once your domain is ready.
        testMode: true,
      });
    `.trim();

    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/plugin.ts',
        existingContent,
        nextContent,
      })
    ).toBe(true);
  });

  test('treats undefined-valued AST keys as absent', () => {
    // `type A = string` emits `TSTypeAliasDeclaration.typeParameters:
    // undefined`. A comparator that counted that key would report a
    // formatting-only edit as a real change and re-prompt on every install.
    const existingContent = `
      type ResendContent = string;

      export const value: ResendContent = 'a';
    `.trim();

    const nextContent = `
      type ResendContent = string;

      export const value: ResendContent = "a";
    `.trim();

    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/types.ts',
        existingContent,
        nextContent,
      })
    ).toBe(true);
  });

  test('preserves added optional syntax', () => {
    const existingContent = 'export function run(value: string) {}';
    const nextContent = 'export function run<T>(value: string) {}';

    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/run.ts',
        existingContent,
        nextContent,
      })
    ).toBe(false);
  });

  test('treats unparseable content as different', () => {
    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/broken.ts',
        existingContent: 'export const a = 1;',
        nextContent: 'export const = ;',
      })
    ).toBe(false);
  });

  test('preserves semantic TypeScript changes', () => {
    const existingContent = `
      export const resendContentTable = convexTable("resend_content", {
        path: text(),
      });
    `.trim();

    const nextContent = `
      export const resendContentTable = convexTable("resend_payload", {
        path: text(),
      });
    `.trim();

    expect(
      isContentEquivalent({
        filePath: 'convex/lib/plugins/resend/schema.ts',
        existingContent,
        nextContent,
      })
    ).toBe(false);
  });
});
