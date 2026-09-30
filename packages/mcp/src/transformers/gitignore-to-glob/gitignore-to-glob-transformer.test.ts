import { gitignoreToGlobTransformer } from './gitignore-to-glob-transformer';
import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '@dungeonmaster/shared/contracts/glob-pattern/glob-pattern.stub';

describe('gitignoreToGlobTransformer', () => {
  describe('line translation', () => {
    it.each([
      ['dist', ['**/dist', '**/dist/**']],
      ['node_modules', ['**/node_modules', '**/node_modules/**']],
      ['worktrees/', ['**/worktrees/**']],
      ['spike-tmp/', ['**/spike-tmp/**']],
      ['/static/', ['static/**']],
      ['tests/tmp/', ['tests/tmp/**']],
      ['/.idea', ['.idea', '.idea/**']],
      ['.nx/cache', ['.nx/cache', '.nx/cache/**']],
      ['*.launch', ['**/*.launch']],
      ['**/*-actual.png', ['**/*-actual.png']],
      ['vite.config.*.timestamp*', ['**/vite.config.*.timestamp*']],
      ['  dist  ', ['**/dist', '**/dist/**']],
    ])('VALID: {line: "%s"} => translates to glob patterns', (line, expected) => {
      const result = gitignoreToGlobTransformer({
        contents: FileContentsStub({ value: line }),
      });

      expect(result).toStrictEqual(expected.map((value) => GlobPatternStub({ value })));
    });
  });

  describe('skipped lines', () => {
    it.each([['# compiled output'], [''], ['   '], ['!.vscode/settings.json'], ['/']])(
      'EMPTY: {line: "%s"} => produces no patterns',
      (line) => {
        const result = gitignoreToGlobTransformer({
          contents: FileContentsStub({ value: line }),
        });

        expect(result).toStrictEqual([]);
      },
    );
  });

  describe('whole file', () => {
    it('VALID: {multi-line .gitignore} => translates every live line in order', () => {
      const result = gitignoreToGlobTransformer({
        contents: FileContentsStub({
          value: '# compiled output\ndist\ntmp\n\n!keep-me\nworktrees/\n',
        }),
      });

      expect(result).toStrictEqual([
        '**/dist',
        '**/dist/**',
        '**/tmp',
        '**/tmp/**',
        '**/worktrees/**',
      ]);
    });

    it('EMPTY: {contents: ""} => produces no patterns', () => {
      const result = gitignoreToGlobTransformer({
        contents: FileContentsStub({ value: '' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
