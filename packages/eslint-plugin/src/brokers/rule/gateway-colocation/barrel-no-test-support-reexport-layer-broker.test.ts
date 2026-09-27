import { IdentifierStub, ImportPathStub } from '@dungeonmaster/shared/contracts';
import { barrelNoTestSupportReexportLayerBroker } from './barrel-no-test-support-reexport-layer-broker';
import { barrelNoTestSupportReexportLayerBrokerProxy } from './barrel-no-test-support-reexport-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('barrelNoTestSupportReexportLayerBroker', () => {
  it('VALID: {reexport source is a plain wrapper} => reports nothing and returns true', () => {
    barrelNoTestSupportReexportLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    const result = barrelNoTestSupportReexportLayerBroker({
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

  it('INVALID: {reexport source ends in .proxy} => reports barrelReexportsTestSupportFile and returns false', () => {
    barrelNoTestSupportReexportLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const name = IdentifierStub({ value: 'readFileSyncProxy' });
    const source = ImportPathStub({ value: './read-file-sync/read-file-sync.proxy' });

    const result = barrelNoTestSupportReexportLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [{ name, source }],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'barrelReexportsTestSupportFile',
      data: { fileName: 'fs.ts', name, source },
    });
  });

  it('INVALID: {reexport source ends in .stub} => reports barrelReexportsTestSupportFile and returns false', () => {
    barrelNoTestSupportReexportLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });
    const name = IdentifierStub({ value: 'FsErrorStub' });
    const source = ImportPathStub({ value: './is-fs-error/fs-error.stub' });

    const result = barrelNoTestSupportReexportLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [{ name, source }],
    });

    expect(result).toBe(false);
    expect(mockReport).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith({
      node,
      messageId: 'barrelReexportsTestSupportFile',
      data: { fileName: 'fs.ts', name, source },
    });
  });

  it('EMPTY: {no reexports} => reports nothing and returns true', () => {
    barrelNoTestSupportReexportLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = EslintContextStub({ report: mockReport });
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    const result = barrelNoTestSupportReexportLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [],
    });

    expect(result).toBe(true);
    expect(mockReport.mock.calls).toStrictEqual([]);
  });
});
