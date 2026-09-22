import { ItemWithIdStub, SignoffStub } from '@dungeonmaster/shared/contracts';

import { signoffElementStampTransformer } from './signoff-element-stamp-transformer';

// The server's reading, distinguishable at a glance from the stub's own default.
const { at: STAMPED_AT } = SignoffStub({ at: '2026-08-16T03:23:41.000Z' });

describe('signoffElementStampTransformer', () => {
  describe('sign-off fields retired', () => {
    it('EMPTY: {element carrying no sign-off at all} => comes back unchanged', () => {
      const result = signoffElementStampTransformer({
        element: ItemWithIdStub({ id: 'redirects', label: 'Redirects to the dashboard' }),
        at: STAMPED_AT,
      });

      expect(result).toStrictEqual({ id: 'redirects', label: 'Redirects to the dashboard' });
    });

    it('VALID: {element with properties} => returned unchanged since sign-off fields are retired', () => {
      const result = signoffElementStampTransformer({
        element: ItemWithIdStub({
          id: 'redirects',
          label: 'Redirects',
          flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
        }),
        at: STAMPED_AT,
      });

      expect(result).toStrictEqual({
        id: 'redirects',
        label: 'Redirects',
        flowriderSignoff: SignoffStub({ at: '2020-01-01T00:00:00.000Z' }),
      });
    });
  });

  describe('the element it was handed', () => {
    it('VALID: {an element} => the input object is left alone, so the caller can keep it', () => {
      const element = ItemWithIdStub({
        id: 'redirects',
        label: 'Redirects',
      });

      signoffElementStampTransformer({ element, at: STAMPED_AT });

      expect(element).toStrictEqual({
        id: 'redirects',
        label: 'Redirects',
      });
    });
  });
});
