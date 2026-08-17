import {
  createTaggedTransformer,
  DATE_CODEC_TAG,
  decodeWire,
  encodeWire,
  getTransformer,
} from './transformer';

describe('crpc transformer', () => {
  test('default transformer encodes and decodes Date recursively', () => {
    const input = {
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      nested: [{ at: new Date('2024-01-02T00:00:00.000Z') }],
    };

    const encoded = encodeWire(input) as any;
    expect(encoded.createdAt).toEqual({
      __crpc: 1,
      t: DATE_CODEC_TAG,
      v: input.createdAt.getTime(),
    });
    expect(encoded.nested[0].at).toEqual({
      __crpc: 1,
      t: DATE_CODEC_TAG,
      v: input.nested[0].at.getTime(),
    });

    const decoded = decodeWire(encoded) as any;
    expect(decoded.createdAt).toBeInstanceOf(Date);
    expect(decoded.createdAt.getTime()).toBe(input.createdAt.getTime());
    expect(decoded.nested[0].at).toBeInstanceOf(Date);
    expect(decoded.nested[0].at.getTime()).toBe(input.nested[0].at.getTime());
  });

  test('supports split input/output transformers', () => {
    const transformer = getTransformer({
      input: {
        serialize: (value) => ({ wrappedInput: value }),
        deserialize: (value) => ({ inputDecoded: value }),
      },
      output: {
        serialize: (value) => ({ wrappedOutput: value }),
        deserialize: (value) => ({ outputDecoded: value }),
      },
    });

    expect(transformer.input.serialize('a')).toEqual({ wrappedInput: 'a' });
    expect(transformer.output.serialize('b')).toEqual({ wrappedOutput: 'b' });
    expect(transformer.input.deserialize('c')).toEqual({ inputDecoded: 'c' });
    expect(transformer.output.deserialize('d')).toEqual({ outputDecoded: 'd' });
  });

  test('always keeps Date transformer enabled when custom transformer is provided', () => {
    const transformer = getTransformer({
      input: {
        serialize: (value) => ({ wrapped: value }),
        deserialize: (value) => (value as any)?.wrapped ?? value,
      },
      output: {
        serialize: (value) => ({ wrapped: value }),
        deserialize: (value) => (value as any)?.wrapped ?? value,
      },
    });

    const now = new Date('2024-01-01T00:00:00.000Z');
    const encoded = transformer.input.serialize({ at: now }) as any;

    expect(encoded).toEqual({
      wrapped: {
        at: {
          __crpc: 1,
          t: DATE_CODEC_TAG,
          v: now.getTime(),
        },
      },
    });

    const decoded = transformer.input.deserialize(encoded) as any;
    expect(decoded.at).toBeInstanceOf(Date);
    expect(decoded.at.getTime()).toBe(now.getTime());
  });

  test('codec registration supports custom tagged types', () => {
    class CustomValue {
      constructor(public readonly value: string) {}
    }

    const custom = createTaggedTransformer([
      {
        tag: '$custom',
        isType: (value): value is CustomValue => value instanceof CustomValue,
        encode: (value) => (value as CustomValue).value,
        decode: (value) => new CustomValue(String(value)),
      },
    ]);

    const encoded = custom.serialize({ item: new CustomValue('ok') }) as any;
    expect(encoded).toEqual({
      item: { __crpc: 1, t: '$custom', v: 'ok' },
    });

    const decoded = custom.deserialize(encoded) as any;
    expect(decoded.item).toBeInstanceOf(CustomValue);
    expect(decoded.item.value).toBe('ok');
  });

  test('codecs claiming primitives still encode them', () => {
    const custom = createTaggedTransformer([
      {
        tag: '$bigint',
        isType: (value) => typeof value === 'bigint',
        encode: (value) => (value as bigint).toString(),
        decode: (value) => BigInt(String(value)),
      },
    ]);

    const encoded = custom.serialize({ n: 10n }) as any;
    expect(encoded).toEqual({ n: { __crpc: 1, t: '$bigint', v: '10' } });
    expect((custom.deserialize(encoded) as any).n).toBe(10n);
  });

  test('codecs claiming one specific primitive value still encode it', () => {
    // An arbitrary predicate can't be classified by sampling representative
    // primitives, so an undeclared codec keeps full dispatch.
    const custom = createTaggedTransformer([
      {
        tag: '$answer',
        isType: (value) => value === 42,
        encode: () => 'forty-two',
        decode: () => 42,
      },
    ]);

    const encoded = custom.serialize({ n: 42 }) as any;
    expect(encoded).toEqual({ n: { __crpc: 1, t: '$answer', v: 'forty-two' } });
    expect((custom.deserialize(encoded) as any).n).toBe(42);
  });

  test('objectsOnly skips primitive dispatch', () => {
    let primitiveChecks = 0;
    const custom = createTaggedTransformer([
      {
        tag: '$map',
        objectsOnly: true,
        isType: (value) => {
          if (value === null || typeof value !== 'object') {
            primitiveChecks += 1;
          }
          return value instanceof Map;
        },
        encode: (value) => [...(value as Map<string, unknown>)],
        decode: (value) => new Map(value as [string, unknown][]),
      },
    ]);

    // Discard the construction-time probes; only per-value dispatch counts.
    primitiveChecks = 0;

    const encoded = custom.serialize({
      m: new Map([['a', 1]]),
      n: 1,
      s: 'x',
    }) as any;
    expect(encoded.m).toEqual({ __crpc: 1, t: '$map', v: [['a', 1]] });
    expect(primitiveChecks).toBe(0);
    expect((custom.deserialize(encoded) as any).m.get('a')).toBe(1);
  });

  test('objectsOnly is rejected when the codec claims a primitive', () => {
    expect(() =>
      createTaggedTransformer([
        {
          tag: '$bigint',
          objectsOnly: true,
          isType: (value) => typeof value === 'bigint',
          encode: (value) => (value as bigint).toString(),
          decode: (value) => BigInt(String(value)),
        },
      ])
    ).toThrow(/objectsOnly/);
  });

  test('unknown tags pass through unchanged', () => {
    const input = {
      value: { $unknown: 'x' },
      nested: [{ $stillUnknown: 1 }],
    };

    const decoded = decodeWire(input);
    expect(decoded).toEqual(input);
  });

  test('avoids cloning payloads when no codec matches', () => {
    const input = {
      count: 1,
      nested: { ok: true },
      list: [{ status: 'ready' }],
    };

    expect(encodeWire(input)).toBe(input);
    expect(decodeWire(input)).toBe(input);
  });

  test('memoizes resolved transformers', () => {
    const custom = {
      input: {
        serialize: (value: unknown) => value,
        deserialize: (value: unknown) => value,
      },
      output: {
        serialize: (value: unknown) => value,
        deserialize: (value: unknown) => value,
      },
    };

    expect(getTransformer()).toBe(getTransformer());
    expect(getTransformer(custom)).toBe(getTransformer(custom));
  });

  test('resolving an already-resolved transformer is the identity', () => {
    const resolved = getTransformer();
    expect(getTransformer(resolved)).toBe(resolved);

    let decodeCalls = 0;
    const custom = getTransformer({
      input: {
        serialize: (value: unknown) => value,
        deserialize: (value: unknown) => value,
      },
      output: {
        serialize: (value: unknown) => value,
        deserialize: (value: unknown) => {
          decodeCalls += 1;
          return value;
        },
      },
    });

    expect(getTransformer(custom)).toBe(custom);
    decodeWire({ ok: true }, custom);
    expect(decodeCalls).toBe(1);
  });

  test('wire payload never uses keys starting with $', () => {
    const encoded = encodeWire({
      list: [new Date('2024-01-01T00:00:00.000Z')],
      nested: {
        at: new Date('2024-01-02T00:00:00.000Z'),
      },
    });

    const walk = (value: unknown) => {
      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item);
        }
        return;
      }

      if (!value || typeof value !== 'object') {
        return;
      }

      for (const [key, nested] of Object.entries(
        value as Record<string, unknown>
      )) {
        expect(key.startsWith('$')).toBe(false);
        walk(nested);
      }
    };

    walk(encoded);
  });

  test('throws on duplicate codec tags', () => {
    expect(() =>
      createTaggedTransformer([
        {
          tag: '$x',
          isType: () => false,
          encode: (value) => value,
          decode: (value) => value,
        },
        {
          tag: '$x',
          isType: () => false,
          encode: (value) => value,
          decode: (value) => value,
        },
      ])
    ).toThrow(/Duplicate wire codec tag/);
  });
});
