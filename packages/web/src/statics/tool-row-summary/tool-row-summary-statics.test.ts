import { toolRowSummaryStatics } from './tool-row-summary-statics';

describe('toolRowSummaryStatics', () => {
  describe('shape', () => {
    it('VALID: {statics} => exposes the inline budget, its suffix, and the unprefixed tools', () => {
      expect(toolRowSummaryStatics).toStrictEqual({
        inlineSummaryLimit: 200,
        truncationSuffix: '...',
        singleValueTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob'],
        fieldSeparator: ', ',
      });
    });
  });
});
