import { censusFileKindTransformer } from './census-file-kind-transformer';
import { CensusPathStub } from '../../contracts/census-path/census-path.stub';

describe('censusFileKindTransformer', () => {
  it.each([
    ['packages/a/src/brokers/x/y/x-y-broker.ts', 'production'],
    ['packages/a/bin/tool.ts', 'production'],
    ['packages/@gateway/node/src/fs/fs.ts', 'production'],
    ['packages/a/src/brokers/x/y/x-y-broker.proxy.ts', 'proxy'],
    ['packages/a/src/widgets/w/w-widget.proxy.tsx', 'proxy'],
    ['packages/a/src/brokers/x/y/x-y-broker.test.ts', 'test'],
    ['packages/a/src/flows/f/f-flow.integration.test.ts', 'test'],
    ['packages/a/src/flows/f/f.e2e.ts', 'test'],
    ['packages/a/src/contracts/c/c.stub.ts', 'stub'],
    ['packages/a/test/harnesses/h/h.harness.ts', 'harness'],
    ['packages/a/adapters.ts', 'barrel'],
    ['packages/@gateway/node/index.ts', 'barrel'],
    ['packages/a/jest/setup.ts', 'other'],
  ])('VALID: {file: %s} => %s', (value, expected) => {
    const result = censusFileKindTransformer({ file: CensusPathStub({ value }) });

    expect(result).toBe(expected);
  });
});
