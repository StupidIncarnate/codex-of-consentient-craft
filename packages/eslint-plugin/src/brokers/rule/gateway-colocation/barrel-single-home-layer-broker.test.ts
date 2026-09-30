import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { barrelSingleHomeLayerBroker } from './barrel-single-home-layer-broker';
import { barrelSingleHomeLayerBrokerProxy } from './barrel-single-home-layer-broker.proxy';

describe('barrelSingleHomeLayerBroker', () => {
  it('VALID: {reexport source stays inside the subpath} => reports nothing and returns true', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });

    const result = barrelSingleHomeLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [
        {
          name: 'readFileSync',
          source: './read-file-sync/read-file-sync',
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('VALID: {reexport source is a bare npm specifier} => reports nothing and returns true', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });

    const result = barrelSingleHomeLayerBroker({
      node,
      context,
      fileName: 'zod.ts',
      reexports: [
        { name: 'default', source: 'zod' },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('INVALID: {reexport source climbs into a sibling subpath} => reports reexportOutsideOwnSubpath and returns false', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });
    const name = 'isFsError';
    const source = '../fs/is-fs-error/is-fs-error';

    const result = barrelSingleHomeLayerBroker({
      node,
      context,
      fileName: 'fs__promises.ts',
      reexports: [{ name, source }],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'reexportOutsideOwnSubpath',
      data: { fileName: 'fs__promises.ts', name, source },
    });
  });

  it('EMPTY: {no reexports} => reports nothing and returns true', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });

    const result = barrelSingleHomeLayerBroker({ node, context, fileName: 'fs.ts', reexports: [] });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });
});
