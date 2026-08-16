import { discoverIgnoreState } from './discover-ignore-state';
import { GlobPatternStub } from '@dungeonmaster/shared/contracts';
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';

describe('discoverIgnoreState', () => {
  it('VALID: {patterns} => stores and retrieves the merged list', () => {
    discoverIgnoreState.clear();

    const patterns = [
      GlobPatternStub({ value: '**/node_modules/**' }),
      GlobPatternStub({ value: '**/worktrees/**' }),
    ];

    discoverIgnoreState.set({ patterns });

    expect(discoverIgnoreState.get()).toStrictEqual(patterns);
  });

  it('EMPTY: {never set} => falls back to the static ignore rules', () => {
    discoverIgnoreState.clear();

    expect(discoverIgnoreState.get()).toStrictEqual(
      fileDiscoveryStatics.globIgnorePatterns.map((value) => GlobPatternStub({ value })),
    );
  });

  it('VALID: clear() => reverts to the static ignore rules', () => {
    discoverIgnoreState.clear();
    discoverIgnoreState.set({ patterns: [GlobPatternStub({ value: '**/tmp/**' })] });

    discoverIgnoreState.clear();

    expect(discoverIgnoreState.get()).toStrictEqual(
      fileDiscoveryStatics.globIgnorePatterns.map((value) => GlobPatternStub({ value })),
    );
  });

  it('VALID: set() twice => the later list replaces the earlier one', () => {
    discoverIgnoreState.clear();

    const replacement = [GlobPatternStub({ value: '**/dist/**' })];

    discoverIgnoreState.set({ patterns: [GlobPatternStub({ value: '**/tmp/**' })] });
    discoverIgnoreState.set({ patterns: replacement });

    expect(discoverIgnoreState.get()).toStrictEqual(replacement);
  });
});
