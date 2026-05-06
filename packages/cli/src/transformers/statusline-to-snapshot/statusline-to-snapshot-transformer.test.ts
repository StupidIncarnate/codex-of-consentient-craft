import { StatuslineInputStub } from '../../contracts/statusline-input/statusline-input.stub';
import { statuslineToSnapshotTransformer } from './statusline-to-snapshot-transformer';

describe('statuslineToSnapshotTransformer', () => {
  it('VALID: full input => returns snapshot with both windows populated', () => {
    const input = StatuslineInputStub();

    const result = statuslineToSnapshotTransformer({
      input,
      nowIso: '2026-05-05T13:00:00.000Z',
    });

    expect(result).toStrictEqual({
      fiveHour: { usedPercentage: 42, resetsAt: '2026-05-05T15:00:00.000Z' },
      sevenDay: { usedPercentage: 20, resetsAt: '2026-05-05T15:00:00.000Z' },
      updatedAt: '2026-05-05T13:00:00.000Z',
    });
  });

  it('EMPTY: {input: {}} => returns snapshot with both windows null', () => {
    const result = statuslineToSnapshotTransformer({
      input: StatuslineInputStub({ rate_limits: undefined }),
      nowIso: '2026-05-05T13:00:00.000Z',
    });

    expect(result).toStrictEqual({
      fiveHour: null,
      sevenDay: null,
      updatedAt: '2026-05-05T13:00:00.000Z',
    });
  });

  it('VALID: {five_hour only} => returns snapshot with sevenDay null', () => {
    const result = statuslineToSnapshotTransformer({
      input: StatuslineInputStub({
        rate_limits: {
          five_hour: { used_percentage: 81, resets_at: '2026-05-05T18:00:00.000Z' },
        },
      }),
      nowIso: '2026-05-05T13:00:00.000Z',
    });

    expect(result).toStrictEqual({
      fiveHour: { usedPercentage: 81, resetsAt: '2026-05-05T18:00:00.000Z' },
      sevenDay: null,
      updatedAt: '2026-05-05T13:00:00.000Z',
    });
  });

  it('EMPTY: {five_hour: {}} => treats incomplete window as null', () => {
    const result = statuslineToSnapshotTransformer({
      input: StatuslineInputStub({
        rate_limits: {
          five_hour: { used_percentage: 50 },
        },
      }),
      nowIso: '2026-05-05T13:00:00.000Z',
    });

    expect(result).toStrictEqual({
      fiveHour: null,
      sevenDay: null,
      updatedAt: '2026-05-05T13:00:00.000Z',
    });
  });
});
