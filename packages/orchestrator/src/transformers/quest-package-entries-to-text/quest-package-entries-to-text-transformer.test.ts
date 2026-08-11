import { QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';

import { questPackageEntriesToTextTransformer } from './quest-package-entries-to-text-transformer';

describe('questPackageEntriesToTextTransformer', () => {
  it('EMPTY: {entries: []} => returns an empty string', () => {
    expect(questPackageEntriesToTextTransformer({ entries: [] })).toBe('');
  });

  it('VALID: {one edit entry} => renders name, changeType and packageType', () => {
    const result = questPackageEntriesToTextTransformer({
      entries: [
        QuestPackageEntryStub({
          name: 'web',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        }),
      ],
    });

    expect(result).toBe('web (edit, frontend-react)');
  });

  it('VALID: {edit, new and delete entries} => renders each in order, comma separated', () => {
    const result = questPackageEntriesToTextTransformer({
      entries: [
        QuestPackageEntryStub({
          name: 'web',
          location: './packages/web',
          changeType: 'edit',
          packageType: 'frontend-react',
        }),
        QuestPackageEntryStub({
          name: 'groundstomp',
          location: './packages/groundstomp',
          changeType: 'new',
          packageType: 'programmatic-service',
          usedBy: ['orchestrator'],
        }),
        QuestPackageEntryStub({
          name: 'legacy',
          location: './packages/legacy',
          changeType: 'delete',
          packageType: 'library',
        }),
      ],
    });

    expect(result).toBe(
      'web (edit, frontend-react), groundstomp (new, programmatic-service), legacy (delete, library)',
    );
  });
});
