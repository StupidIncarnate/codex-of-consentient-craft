import { QuestPackageEntryStub } from '../../contracts/quest-package-entry/quest-package-entry.stub';
import { questPackageEntryKindsTransformer } from './quest-package-entry-kinds-transformer';

describe('questPackageEntryKindsTransformer', () => {
  describe('stamped entries', () => {
    it('VALID: {packageTypes: [http-backend, frontend-react]} => returns both kinds, the label first', () => {
      const entry = QuestPackageEntryStub({
        name: 'storefront',
        packageType: 'http-backend',
        packageTypes: ['http-backend', 'frontend-react'],
      });

      expect(questPackageEntryKindsTransformer({ entry })).toStrictEqual([
        'http-backend',
        'frontend-react',
      ]);
    });

    it('VALID: {packageTypes: [library]} => returns the single stamped kind', () => {
      const entry = QuestPackageEntryStub({ packageType: 'library' });

      expect(questPackageEntryKindsTransformer({ entry })).toStrictEqual(['library']);
    });
  });

  describe('unstamped entries', () => {
    it('EMPTY: {packageTypes: []} => falls back to the declared label, so an entry no save has stamped still resolves to a kind', () => {
      const entry = QuestPackageEntryStub({
        packageType: 'frontend-react',
        packageTypes: [],
      });

      expect(questPackageEntryKindsTransformer({ entry })).toStrictEqual(['frontend-react']);
    });
  });

  describe('isolation', () => {
    it('VALID: {mutating the returned array} => leaves the entry untouched, so a caller sorting its copy cannot reorder the stamped set', () => {
      const entry = QuestPackageEntryStub({
        packageType: 'http-backend',
        packageTypes: ['http-backend', 'frontend-react'],
      });

      const kinds = questPackageEntryKindsTransformer({ entry });
      kinds.pop();

      expect(entry.packageTypes).toStrictEqual(['http-backend', 'frontend-react']);
    });
  });
});
