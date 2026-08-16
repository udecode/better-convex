import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CommandFailedError,
  getLocalResendInstallSpec,
  run,
} from './scaffold-utils';

test('run throws a structured error unless non-zero exit is allowed', async () => {
  const command = [process.execPath, '-e', 'process.exit(7)'];

  await expect(run(command, process.cwd())).rejects.toEqual(
    expect.objectContaining<Partial<CommandFailedError>>({
      command,
      cwd: process.cwd(),
      exitCode: 7,
      name: 'CommandFailedError',
    })
  );
  await expect(
    run(command, process.cwd(), { allowNonZeroExit: true })
  ).resolves.toBe(7);
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
