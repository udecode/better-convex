import { describe, expect, test } from 'bun:test';
import { parseSchemaSource } from './schema-parse';

const schemaSource = (tableName: string) =>
  `
export const tables = {
  ${tableName}: convexTable('${tableName}', {}),
};
export default defineSchema(tables);
`.trim();

describe('cli/registry/schema-parse', () => {
  test('reuses the parse for identical source text', () => {
    const source = schemaSource('todos');

    expect(parseSchemaSource(source)).toBe(parseSchemaSource(source));
  });

  test('keys on file name as well as text', () => {
    const source = schemaSource('todos');

    expect(parseSchemaSource(source)).not.toBe(
      parseSchemaSource(source, 'auth-schema.ts')
    );
  });

  test('parses distinct revisions independently', () => {
    const first = parseSchemaSource(schemaSource('todos'));
    const second = parseSchemaSource(schemaSource('tags'));

    expect(first).not.toBe(second);
    expect(first.text).toContain('todos');
    expect(second.text).toContain('tags');
  });

  test('bounds retained ASTs', () => {
    const source = schemaSource('bounded_0');
    const parsed = parseSchemaSource(source);

    for (let index = 1; index <= 16; index++) {
      parseSchemaSource(schemaSource(`bounded_${index}`));
    }

    expect(parseSchemaSource(source)).not.toBe(parsed);
  });
});
