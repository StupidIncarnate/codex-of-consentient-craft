import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { binResolveHarness } from '../../../../test/harnesses/bin-resolve/bin-resolve.harness';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import { binResolveBroker } from './bin-resolve-broker';

// The unit tests stage every existsSync and readFileSync by exact path, so they would stay green
// against a walk that built the wrong path on a real disk. This one lays a real workspace tree
// down and grades the claim F60 found broken: a consumer's ward ran the jest on its shell PATH
// instead of its own.
describe('binResolveBroker (integration)', () => {
  const harness = binResolveHarness();

  it('VALID: {jest in the workspace root .bin, a different jest first on PATH, package has no .bin} => returns the root .bin path, never the bare name', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-bin-resolve' }),
    });
    const root = AbsoluteFilePathStub({ value: testbed.guildPath });
    await harness.seedFile({
      root,
      relativePath: 'package.json',
      contents: JSON.stringify({ name: 'consumer', workspaces: ['packages/*'] }),
    });
    await harness.seedFile({
      root,
      relativePath: 'packages/app/package.json',
      contents: JSON.stringify({ name: 'app' }),
    });
    await harness.seedFile({
      root,
      relativePath: 'node_modules/.bin/jest',
      contents: '#!/bin/sh\n',
    });
    harness.prependPathDecoy({ root, binName: 'jest' });
    const cwd = AbsoluteFilePathStub({ value: `${testbed.guildPath}/packages/app` });

    const result = binResolveBroker({ binName: BinCommandStub({ value: 'jest' }), cwd });

    const firstPathDir = harness.firstPathDir();

    testbed.cleanup();

    expect({ result: String(result), firstPathDir: String(firstPathDir) }).toStrictEqual({
      result: `${testbed.guildPath}/node_modules/.bin/jest`,
      firstPathDir: `${testbed.guildPath}/decoy-path`,
    });
  });

  it('VALID: {package has its own jest .bin and the root has one too} => the package copy wins', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-bin-resolve-own' }),
    });
    const root = AbsoluteFilePathStub({ value: testbed.guildPath });
    await harness.seedFile({
      root,
      relativePath: 'package.json',
      contents: JSON.stringify({ name: 'consumer', workspaces: ['packages/*'] }),
    });
    await harness.seedFile({
      root,
      relativePath: 'node_modules/.bin/jest',
      contents: '#!/bin/sh\n',
    });
    await harness.seedFile({
      root,
      relativePath: 'packages/app/node_modules/.bin/jest',
      contents: '#!/bin/sh\n',
    });
    const cwd = AbsoluteFilePathStub({ value: `${testbed.guildPath}/packages/app` });

    const result = binResolveBroker({ binName: BinCommandStub({ value: 'jest' }), cwd });

    testbed.cleanup();

    expect(String(result)).toBe(`${testbed.guildPath}/packages/app/node_modules/.bin/jest`);
  });

  it('VALID: {no .bin anywhere in the tree, decoy on PATH} => returns the bare name', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-bin-resolve-bare' }),
    });
    const root = AbsoluteFilePathStub({ value: testbed.guildPath });
    await harness.seedFile({
      root,
      relativePath: 'package.json',
      contents: JSON.stringify({ name: 'consumer', workspaces: ['packages/*'] }),
    });
    await harness.seedFile({
      root,
      relativePath: 'packages/app/package.json',
      contents: JSON.stringify({ name: 'app' }),
    });
    harness.prependPathDecoy({ root, binName: 'jest' });
    const cwd = AbsoluteFilePathStub({ value: `${testbed.guildPath}/packages/app` });

    const result = binResolveBroker({ binName: BinCommandStub({ value: 'jest' }), cwd });

    testbed.cleanup();

    expect(String(result)).toBe('jest');
  });
});
