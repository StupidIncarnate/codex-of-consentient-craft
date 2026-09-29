import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { ImportPathStub } from '@dungeonmaster/shared/contracts/import-path/import-path.stub';
import { barrelSingleHomeLayerBroker } from './barrel-single-home-layer-broker';
import { barrelSingleHomeLayerBrokerProxy } from './barrel-single-home-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('barrelSingleHomeLayerBroker', () => {
  it('VALID: {reexport source stays inside the subpath} => reports nothing and returns true', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    const result = barrelSingleHomeLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [
        {
          name: IdentifierStub({ value: 'readFileSync' }),
          source: ImportPathStub({ value: './read-file-sync/read-file-sync' }),
        },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('VALID: {reexport source is a bare npm specifier} => reports nothing and returns true', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    const result = barrelSingleHomeLayerBroker({
      node,
      context,
      fileName: 'zod.ts',
      reexports: [
        { name: IdentifierStub({ value: 'default' }), source: ImportPathStub({ value: 'zod' }) },
      ],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });

  it('INVALID: {reexport source climbs into a sibling subpath} => reports reexportOutsideOwnSubpath and returns false', () => {
    barrelSingleHomeLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const name = IdentifierStub({ value: 'isFsError' });
    const source = ImportPathStub({ value: '../fs/is-fs-error/is-fs-error' });

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
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    const result = barrelSingleHomeLayerBroker({ node, context, fileName: 'fs.ts', reexports: [] });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });
});
