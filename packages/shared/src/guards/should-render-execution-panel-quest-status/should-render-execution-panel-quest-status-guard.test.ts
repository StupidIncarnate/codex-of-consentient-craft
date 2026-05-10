import { shouldRenderExecutionPanelQuestStatusGuard } from './should-render-execution-panel-quest-status-guard';
import { questStatusMetadataStatics } from '../../statics/quest-status-metadata/quest-status-metadata-statics';

const STATUSES = Object.keys(
  questStatusMetadataStatics.statuses,
) as readonly (keyof typeof questStatusMetadataStatics.statuses)[];

const RENDER_EXECUTION_PANEL_STATUSES: ReadonlySet<
  keyof typeof questStatusMetadataStatics.statuses
> = new Set([
  'seek_scope',
  'seek_synth',
  'seek_walk',
  'in_progress',
  'paused',
  'blocked',
  'complete',
  'abandoned',
]);

describe('shouldRenderExecutionPanelQuestStatusGuard', () => {
  describe('state matrix', () => {
    it.each(STATUSES)('VALID: {status: %s} => returns expected flag', (status) => {
      const expected = RENDER_EXECUTION_PANEL_STATUSES.has(status);

      const result = shouldRenderExecutionPanelQuestStatusGuard({ status });

      expect(result).toBe(expected);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = shouldRenderExecutionPanelQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
