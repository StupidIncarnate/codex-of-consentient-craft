import { isBareUuidChatProcessIdGuard } from './is-bare-uuid-chat-process-id-guard';

describe('isBareUuidChatProcessIdGuard', () => {
  describe('positive cases', () => {
    it('VALID: {bare lowercase uuid v4} => true', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: '619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(true);
    });

    it('VALID: {bare hex uuid with leading numeric segment} => true', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: '0000aaaa-1111-2222-3333-bbbbccccdddd',
        }),
      ).toBe(true);
    });
  });

  describe('rejected prefixes', () => {
    it('VALID: {exec-replay- prefix} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'exec-replay-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });

    it('VALID: {replay- prefix} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'replay-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });

    it('VALID: {chat- prefix} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'chat-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });

    it('VALID: {design- prefix} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'design-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });

    it('VALID: {proc- prefix} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'proc-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });

    it('VALID: {proc-queue- prefix is also caught by proc- check} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: 'proc-queue-619e2258-918c-4408-aeb1-f8f4ce8400cb',
        }),
      ).toBe(false);
    });
  });

  describe('rejected non-uuid shapes', () => {
    it('VALID: {undefined chatProcessId} => false', () => {
      expect(isBareUuidChatProcessIdGuard({})).toBe(false);
    });

    it('VALID: {empty string} => false', () => {
      expect(isBareUuidChatProcessIdGuard({ chatProcessId: '' })).toBe(false);
    });

    it('VALID: {non-uuid free text} => false', () => {
      expect(isBareUuidChatProcessIdGuard({ chatProcessId: 'not-a-uuid-at-all' })).toBe(false);
    });

    it('VALID: {uppercase hex chars} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: '619E2258-918C-4408-AEB1-F8F4CE8400CB',
        }),
      ).toBe(false);
    });

    it('VALID: {trailing extra characters after uuid} => false', () => {
      expect(
        isBareUuidChatProcessIdGuard({
          chatProcessId: '619e2258-918c-4408-aeb1-f8f4ce8400cb-extra',
        }),
      ).toBe(false);
    });
  });
});
