import { ItemWithIdStub, SignoffStub } from '@dungeonmaster/shared/contracts';
import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { signoffElementStampTransformer } from './signoff-element-stamp-transformer';

// The server's reading, distinguishable at a glance from the stub's own default.
const { at: STAMPED_AT } = SignoffStub({ at: '2026-08-16T03:23:41.000Z' });

// Every track a unit can be signed on, read from the statics rather than listed here, so a third
// track added later is exercised by these cases instead of silently skipped.
const TRACK_FIELDS = signoffTracksStatics.fields;

describe('signoffElementStampTransformer', () => {
  describe('a track the element writes', () => {
    it.each(TRACK_FIELDS)(
      'VALID: {%sSignoff carrying a client at} => that value is replaced by the server stamp',
      (track) => {
        const result = signoffElementStampTransformer({
          element: ItemWithIdStub({
            id: 'redirects',
            [`${track}Signoff`]: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
          }),
          at: STAMPED_AT,
        });

        expect(result).toStrictEqual({
          id: 'redirects',
          [`${track}Signoff`]: SignoffStub({ at: '2026-08-16T03:23:41.000Z' }),
        });
      },
    );

    it('VALID: {both tracks written in one element} => both carry the server stamp', () => {
      const result = signoffElementStampTransformer({
        element: ItemWithIdStub({
          id: 'redirects',
          flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
          siegemasterSignoff: SignoffStub({
            evidence: 'walked it against the dev server',
            at: '2020-01-01T00:00:00.000Z',
          }),
        }),
        at: STAMPED_AT,
      });

      expect(result).toStrictEqual({
        id: 'redirects',
        flowriderSignoff: SignoffStub({ at: '2026-08-16T03:23:41.000Z' }),
        siegemasterSignoff: SignoffStub({
          evidence: 'walked it against the dev server',
          at: '2026-08-16T03:23:41.000Z',
        }),
      });
    });
  });

  describe('a track the element does not write', () => {
    it('EMPTY: {element carrying no sign-off at all} => comes back unchanged', () => {
      const result = signoffElementStampTransformer({
        element: ItemWithIdStub({ id: 'redirects', label: 'Redirects to the dashboard' }),
        at: STAMPED_AT,
      });

      expect(result).toStrictEqual({ id: 'redirects', label: 'Redirects to the dashboard' });
    });

    it.each(TRACK_FIELDS)(
      'EDGE: {%sSignoff: null, the walk-reset clear marker} => stays null rather than becoming a stamped sign-off',
      (track) => {
        const result = signoffElementStampTransformer({
          element: ItemWithIdStub({ id: 'redirects', [`${track}Signoff`]: null }),
          at: STAMPED_AT,
        });

        expect(result).toStrictEqual({ id: 'redirects', [`${track}Signoff`]: null });
      },
    );

    it('VALID: {one track written, the other already on the element} => only the written one is re-stamped', () => {
      const result = signoffElementStampTransformer({
        element: ItemWithIdStub({
          id: 'redirects',
          flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
        }),
        at: STAMPED_AT,
      });

      expect(result).toStrictEqual({
        id: 'redirects',
        flowriderSignoff: SignoffStub({ at: '2026-08-16T03:23:41.000Z' }),
      });
    });
  });

  describe('the element it was handed', () => {
    it('VALID: {an element with a sign-off} => the input object is left alone, so the caller can keep it', () => {
      const element = ItemWithIdStub({
        id: 'redirects',
        flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
      });

      signoffElementStampTransformer({ element, at: STAMPED_AT });

      expect(element).toStrictEqual({
        id: 'redirects',
        flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
      });
    });
  });
});
