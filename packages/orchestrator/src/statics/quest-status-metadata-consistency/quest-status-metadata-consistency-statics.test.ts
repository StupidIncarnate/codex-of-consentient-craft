import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { questStatusMetadataConsistencyStatics } from './quest-status-metadata-consistency-statics';
import { recoverableQuestStatusesStatics } from '../recoverable-quest-statuses/recoverable-quest-statuses-statics';
import { startableQuestStatusesStatics } from '../startable-quest-statuses/startable-quest-statuses-statics';
import { autoResumableQuestStatusesStatics } from '../auto-resumable-quest-statuses/auto-resumable-quest-statuses-statics';

type MetaStatus = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly MetaStatus[];

const LEGACY_RECOVERABLE: ReadonlySet<MetaStatus> = new Set(
  recoverableQuestStatusesStatics as readonly MetaStatus[],
);
const LEGACY_STARTABLE: ReadonlySet<MetaStatus> = new Set(
  startableQuestStatusesStatics as readonly MetaStatus[],
);
const LEGACY_AUTO_RESUMABLE: ReadonlySet<MetaStatus> = new Set(
  autoResumableQuestStatusesStatics as readonly MetaStatus[],
);

describe('questStatusMetadataConsistencyStatics', () => {
  describe('placeholder value', () => {
    it('VALID: note => describes temporary consistency check', () => {
      expect(questStatusMetadataConsistencyStatics).toStrictEqual({
        note: 'Phase-2 double-entry bookkeeping between shared metadata and legacy orchestrator quest-status statics. Deleted in Phase 8.',
      });
    });
  });

  describe('metadata coverage', () => {
    it.each(STATUSES)('VALID: {status: %s} => has a metadata row', (status) => {
      const row = questStatusMetadataStatics.statuses[status];

      expect(row.isRecoverable).toBe(LEGACY_RECOVERABLE.has(status));
    });
  });

  describe('isRecoverable matches legacy recoverableQuestStatusesStatics', () => {
    it.each(STATUSES)(
      'VALID: {status: %s} => metadata.isRecoverable matches legacy set membership',
      (status) => {
        const metadataFlag = questStatusMetadataStatics.statuses[status].isRecoverable;
        const legacyFlag = LEGACY_RECOVERABLE.has(status);

        expect(metadataFlag).toBe(legacyFlag);
      },
    );
  });

  describe('isStartable matches legacy startableQuestStatusesStatics', () => {
    it.each(STATUSES)(
      'VALID: {status: %s} => metadata.isStartable matches legacy set membership',
      (status) => {
        const metadataFlag = questStatusMetadataStatics.statuses[status].isStartable;
        const legacyFlag = LEGACY_STARTABLE.has(status);

        expect(metadataFlag).toBe(legacyFlag);
      },
    );
  });

  describe('isAutoResumable matches legacy autoResumableQuestStatusesStatics', () => {
    it.each(STATUSES)(
      'VALID: {status: %s} => metadata.isAutoResumable matches legacy set membership',
      (status) => {
        const metadataFlag = questStatusMetadataStatics.statuses[status].isAutoResumable;
        const legacyFlag = LEGACY_AUTO_RESUMABLE.has(status);

        expect(metadataFlag).toBe(legacyFlag);
      },
    );
  });

  describe('internal invariants', () => {
    it.each(STATUSES)(
      'VALID: {status: %s} => (isTerminal, isActivelyExecuting) pair is never (true, true)',
      (status) => {
        const row = questStatusMetadataStatics.statuses[status];
        const bothTrueCount = Number(row.isTerminal) * Number(row.isActivelyExecuting);

        expect(bothTrueCount).toBe(0);
      },
    );

    it.each(STATUSES)(
      'VALID: {status: %s} => (isAutoResumable, isActivelyExecuting) pair never (true, false)',
      (status) => {
        const row = questStatusMetadataStatics.statuses[status];
        const violationCount = Number(row.isAutoResumable) * Number(!row.isActivelyExecuting);

        expect(violationCount).toBe(0);
      },
    );

    it.each(STATUSES)(
      'VALID: {status: %s} => (isPauseable, isAnyAgentRunning) pair never (true, false)',
      (status) => {
        const row = questStatusMetadataStatics.statuses[status];
        const violationCount = Number(row.isPauseable) * Number(!row.isAnyAgentRunning);

        expect(violationCount).toBe(0);
      },
    );
  });
});
