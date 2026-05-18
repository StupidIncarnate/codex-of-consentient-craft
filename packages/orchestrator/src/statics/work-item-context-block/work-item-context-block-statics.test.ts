import { workItemContextBlockStatics } from './work-item-context-block-statics';

describe('workItemContextBlockStatics', () => {
  it('VALID: full statics export => returns the canonical block format', () => {
    expect(workItemContextBlockStatics).toStrictEqual({
      separator: '---',
      heading: '## Work item context',
      labels: {
        questId: '- questId:',
        workItemId: '- workItemId:',
        role: '- role:',
        packagesAffected: '- packagesAffected:',
        wardMode: '- wardMode:',
      },
    });
  });
});
