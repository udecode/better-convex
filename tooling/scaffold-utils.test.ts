import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getLocalResendInstallSpec, mapWithConcurrency } from './scaffold-utils';

test('mapWithConcurrency dispatches in order and bounds in-flight work', async () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const dispatched: number[] = [];
  let inFlight = 0;
  let peakInFlight = 0;

  const results = await mapWithConcurrency(items, 3, async (item) => {
    dispatched.push(item);
    inFlight += 1;
    peakInFlight = Math.max(peakInFlight, inFlight);
    await Bun.sleep(1);
    inFlight -= 1;

    return item * 2;
  });

  expect(dispatched).toEqual(items);
  expect(peakInFlight).toBe(3);
  expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
});

test('mapWithConcurrency stops dispatching after a rejection', async () => {
  const dispatched: number[] = [];

  const pending = mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (item) => {
    dispatched.push(item);
    await Bun.sleep(1);

    if (item === 1) {
      throw new Error('boom');
    }

    return item;
  });

  await expect(pending).rejects.toThrow('boom');
  expect(dispatched).toContain(1);
  expect(dispatched.length).toBeLessThan(6);
});

test('getLocalResendInstallSpec packs resend with a package manifest', () => {
  const installSpec = getLocalResendInstallSpec();
  expect(installSpec.startsWith('file:')).toBe(true);

  const tarballPath = installSpec.slice('file:'.length);
  const extractDir = mkdtempSync(
    path.join(tmpdir(), 'kitcn-resend-pack-test-')
  );

  try {
    const extract = Bun.spawnSync({
      cmd: ['tar', '-xzf', tarballPath, '-C', extractDir],
      stderr: 'pipe',
      stdout: 'pipe',
    });

    expect(extract.exitCode).toBe(0);

    const packageJson = JSON.parse(
      readFileSync(path.join(extractDir, 'package', 'package.json'), 'utf8')
    ) as {
      name: string;
      peerDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.name).toBe('@kitcn/resend');
    expect(packageJson.peerDependencies?.kitcn).toBe('>=0.11.0 <1');
    expect(packageJson.scripts?.prepack).toBeUndefined();
  } finally {
    rmSync(extractDir, { force: true, recursive: true });
  }
});
