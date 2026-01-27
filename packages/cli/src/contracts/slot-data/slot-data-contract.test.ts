import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../iso-timestamp/iso-timestamp.stub';
import { slotDataContract } from './slot-data-contract';
import { SlotDataStub } from './slot-data.stub';

describe('slotDataContract', () => {
  describe('valid slot data', () => {
    it('VALID: {stepId, sessionId, startedAt} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const startedAt = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

      const result = slotDataContract.parse({
        stepId,
        sessionId,
        startedAt,
      });

      expect(result).toStrictEqual({
        stepId,
        sessionId,
        startedAt,
      });
    });

    it('VALID: {stub defaults} => parses with default values', () => {
      const slotData = SlotDataStub();

      const result = slotDataContract.parse(slotData);

      expect(result).toStrictEqual(slotData);
    });
  });

  describe('invalid slot data', () => {
    it('INVALID_STEP_ID: {stepId: "not-a-uuid"} => throws Invalid uuid', () => {
      const sessionId = SessionIdStub();
      const startedAt = IsoTimestampStub();

      expect(() =>
        slotDataContract.parse({
          stepId: 'not-a-uuid',
          sessionId,
          startedAt,
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID_SESSION_ID: {sessionId: ""} => throws too_small', () => {
      const stepId = StepIdStub();
      const startedAt = IsoTimestampStub();

      expect(() =>
        slotDataContract.parse({
          stepId,
          sessionId: '',
          startedAt,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_STARTED_AT: {startedAt: "not-a-datetime"} => throws Invalid datetime', () => {
      const stepId = StepIdStub();
      const sessionId = SessionIdStub();

      expect(() =>
        slotDataContract.parse({
          stepId,
          sessionId,
          startedAt: 'not-a-datetime',
        }),
      ).toThrow(/Invalid datetime/u);
    });

    it('INVALID_MISSING: {} => throws Required', () => {
      expect(() => slotDataContract.parse({})).toThrow(/Required/u);
    });
  });
});
