import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueSweepTransformer } from './comment-queue-sweep-transformer';

const NOW_MS = Date.parse('2026-07-28T00:00:00.000Z');
const WINDOW_MS = commentQueueStatics.expiry.days * commentQueueStatics.expiry.msPerDay;

describe('commentQueueSweepTransformer', () => {
  it('EMPTY: {entries: []} => returns empty array', () => {
    const result = commentQueueSweepTransformer({ entries: [], nowMs: NOW_MS });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {entry 8 days old} => drops the entry', () => {
    const eightDaysMs = 8 * commentQueueStatics.expiry.msPerDay;
    const entry = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - eightDaysMs).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [entry], nowMs: NOW_MS });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {entry 6 days old} => keeps the entry', () => {
    const sixDaysMs = 6 * commentQueueStatics.expiry.msPerDay;
    const entry = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - sixDaysMs).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [entry], nowMs: NOW_MS });

    expect(result).toStrictEqual([entry]);
  });

  it('VALID: {one 8-day-old and one 1-day-old entry} => retains exactly the 1-day-old entry', () => {
    const eightDaysMs = 8 * commentQueueStatics.expiry.msPerDay;
    const stale = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - eightDaysMs).toISOString(),
    });
    const fresh = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - commentQueueStatics.expiry.msPerDay).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [stale, fresh], nowMs: NOW_MS });

    expect(result).toStrictEqual([fresh]);
  });

  it('EDGE: {entry exactly at the 7-day boundary} => keeps the entry', () => {
    const entry = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - WINDOW_MS).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [entry], nowMs: NOW_MS });

    expect(result).toStrictEqual([entry]);
  });

  it('EDGE: {entry one millisecond past the 7-day boundary} => drops the entry', () => {
    const entry = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS - WINDOW_MS - 1).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [entry], nowMs: NOW_MS });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {entry with a future createdAt} => keeps the entry', () => {
    const entry = CommentQueueEntryStub({
      createdAt: new Date(NOW_MS + commentQueueStatics.expiry.msPerDay).toISOString(),
    });

    const result = commentQueueSweepTransformer({ entries: [entry], nowMs: NOW_MS });

    expect(result).toStrictEqual([entry]);
  });
});
