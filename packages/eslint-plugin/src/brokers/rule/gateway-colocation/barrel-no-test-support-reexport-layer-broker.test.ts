import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { ImportPathStub } from '@dungeonmaster/shared/contracts/import-path/import-path.stub';
import { barrelNoTestSupportReexportLayerBroker } from './barrel-no-test-support-reexport-layer-broker';
import { barrelNoTestSupportReexportLayerBrokerProxy } from './barrel-no-test-support-reexport-layer-broker.proxy';

describe('barrelNoTestSupportReexportLayerBroker', () => {
  it('VALID: {reexport source is a plain wrapper} => reports nothing and returns true', () => {
    barrelNoTestSupportReexportLayerBrokerProxy();
    const mockReport = jest.fn();
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });

    const result = barrelNoTestSupportReexportLayerBroker({
      node,
      context,
      fileName: 'fs.ts',
      reexports: [
        {
          name: 'readFileSync',
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
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });
    const name = 'readFileSyncProxy';
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
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });
    const name = 'FsErrorStub';
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
    const context = RuleContextStub({ report: mockReport });
    const node = ProgramStub({ code: '' });

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
