import { WorkItemIndexRowStub } from '../../contracts/work-item-index-row/work-item-index-row.stub';

import { questIndexToTextTransformer } from './quest-index-to-text-transformer';

describe('questIndexToTextTransformer', () => {
  describe('empty quest', () => {
    it("EMPTY: {rows: [], userRequest: undefined} => returns ''", () => {
      const result = questIndexToTextTransformer({ rows: [] });

      expect(String(result)).toBe('');
    });

    it('EMPTY: {rows: [], userRequest set} => prints only the user request line', () => {
      const result = questIndexToTextTransformer({ userRequest: 'Add auth', rows: [] });

      expect(String(result)).toBe('User request: Add auth');
    });
  });

  describe('a single row', () => {
    it('VALID: {every field set} => renders the whole label block', () => {
      const row = WorkItemIndexRowStub({
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        wallClockSeconds: 300,
        operationText: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
        transcriptSizeBytes: 2_048,
        subagentCount: 1,
        wardRiftcarverSummary: 'ward exit 0 (full)',
      });

      const result = questIndexToTextTransformer({ userRequest: 'Add notifications', rows: [row] });

      expect(String(result)).toBe(
        [
          'User request: Add notifications',
          '',
          [
            'Work item 1 — codeweaver (complete)',
            '  Work item id            f47ac10b-58cc-4372-a567-0e02b2c3d479',
            '  Session id              f47ac10b-58cc-4372-a567-0e02b2c3d479',
            '  Wall clock              5.0 minutes',
            '  Operation               core: notification adapter',
            '  Flows                   notify-flow',
            '  Packages                core',
            '  Transcript size         2,048 bytes',
            '  Sub-agents              1',
            '  Ward/riftcarver         ward exit 0 (full)',
          ].join('\n'),
        ].join('\n'),
      );
    });

    it('EMPTY: {only the required fields} => every optional column reads "(none)"', () => {
      const row = WorkItemIndexRowStub();

      const result = questIndexToTextTransformer({ userRequest: 'Add auth', rows: [row] });

      expect(String(result)).toBe(
        [
          'User request: Add auth',
          '',
          [
            'Work item 1 — codeweaver (complete)',
            '  Work item id            f47ac10b-58cc-4372-a567-0e02b2c3d479',
            '  Session id              (none)',
            '  Wall clock              (not completed)',
            '  Operation               (none)',
            '  Flows                   (none)',
            '  Packages                (none)',
            '  Transcript size         0 bytes',
            '  Sub-agents              0',
            '  Ward/riftcarver         (none)',
          ].join('\n'),
        ].join('\n'),
      );
    });
  });

  describe('multiple rows', () => {
    it('VALID: {two rows} => numbers them in order, separated by a blank line', () => {
      const rowOne = WorkItemIndexRowStub({ workItemId: 'work-item-one', role: 'codeweaver' });
      const rowTwo = WorkItemIndexRowStub({ workItemId: 'work-item-two', role: 'flowrider' });

      const result = questIndexToTextTransformer({
        userRequest: 'Add auth',
        rows: [rowOne, rowTwo],
      });

      expect(String(result)).toBe(
        [
          'User request: Add auth',
          '',
          [
            'Work item 1 — codeweaver (complete)',
            '  Work item id            work-item-one',
            '  Session id              (none)',
            '  Wall clock              (not completed)',
            '  Operation               (none)',
            '  Flows                   (none)',
            '  Packages                (none)',
            '  Transcript size         0 bytes',
            '  Sub-agents              0',
            '  Ward/riftcarver         (none)',
          ].join('\n'),
          '',
          [
            'Work item 2 — flowrider (complete)',
            '  Work item id            work-item-two',
            '  Session id              (none)',
            '  Wall clock              (not completed)',
            '  Operation               (none)',
            '  Flows                   (none)',
            '  Packages                (none)',
            '  Transcript size         0 bytes',
            '  Sub-agents              0',
            '  Ward/riftcarver         (none)',
          ].join('\n'),
        ].join('\n'),
      );
    });
  });
});
