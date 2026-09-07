import { folderDetailCallLookupContract } from './folder-detail-call-lookup-contract';
import { FolderDetailCallLookupStub } from './folder-detail-call-lookup.stub';

describe('folderDetailCallLookupContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly called, not-called and undetermined', () => {
      expect(folderDetailCallLookupContract.options).toStrictEqual([
        'called',
        'not-called',
        'undetermined',
      ]);
    });

    it.each(folderDetailCallLookupContract.options)(
      'VALID: {lookup: %s} => parses to itself',
      (lookup) => {
        expect(FolderDetailCallLookupStub({ value: lookup })).toBe(lookup);
      },
    );
  });

  describe('invalid input', () => {
    it('INVALID: {value: "maybe"} => throws', () => {
      expect(() => FolderDetailCallLookupStub({ value: 'maybe' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: 1} => throws', () => {
      expect(() => folderDetailCallLookupContract.parse(1 as never)).toThrow(/received number/u);
    });
  });
});
