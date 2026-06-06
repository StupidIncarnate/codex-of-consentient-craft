import { blightwardenMinionRolesStatics } from './blightwarden-minion-roles-statics';

describe('blightwardenMinionRolesStatics', () => {
  it('VALID: exports the five minion roles in dispatch order', () => {
    expect(blightwardenMinionRolesStatics).toStrictEqual({
      roles: [
        'blightwarden-security-minion',
        'blightwarden-dedup-minion',
        'blightwarden-perf-minion',
        'blightwarden-integrity-minion',
        'blightwarden-dead-code-minion',
      ],
    });
  });
});
