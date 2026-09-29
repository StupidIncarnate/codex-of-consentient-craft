import { adapterRecordContract } from './adapter-record-contract';
import { AdapterRecordStub } from './adapter-record.stub';

describe('adapterRecordContract', () => {
  it('VALID: {defaults} => a pass-through adapter with one gateway match', () => {
    const result = AdapterRecordStub();

    expect(result).toStrictEqual({
      file: 'packages/example/src/adapters/fs/read-file/fs-read-file-adapter.ts',
      exportNames: ['fsReadFileAdapter'],
      shape: 'pass-through',
      reasons: [],
      outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
      gateway: [{ importPath: '#gateway/node/fs__promises', name: 'readFile', match: 'exact' }],
      productionCallers: [],
      testFiles: [],
      proxyFiles: [],
      adapterProxy: null,
    });
  });

  it('VALID: {shape: "logic", reasons: ["try-catch"]} => keeps the reasons', () => {
    const result = AdapterRecordStub({ shape: 'logic', reasons: ['try-catch'] });

    expect(result.reasons).toStrictEqual(['try-catch']);
  });

  it('INVALID: {shape: "other"} => throws an invalid-option error', () => {
    expect(() => AdapterRecordStub({ shape: 'other' })).toThrow(/^[\s\S]*Invalid option[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = AdapterRecordStub();

    const result = adapterRecordContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
