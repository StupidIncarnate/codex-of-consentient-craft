import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { bootFailureMarkerContract } from './boot-failure-marker-contract';
import { BootFailureMarkerStub } from './boot-failure-marker.stub';

type BootFailureMarker = ReturnType<typeof BootFailureMarkerStub>;

describe('bootFailureMarkerContract', () => {
  describe('valid markers', () => {
    it('VALID: {message, atMs} => parses successfully', () => {
      const marker: BootFailureMarker = BootFailureMarkerStub({
        message: ContentTextStub({ value: 'Refusing to boot against the real CLI' }),
        atMs: EpochMsStub({ value: 1_700_000_000_000 }),
      });

      const result = bootFailureMarkerContract.parse(marker);

      expect(result).toStrictEqual({
        message: 'Refusing to boot against the real CLI',
        atMs: 1_700_000_000_000,
      });
    });
  });

  describe('invalid markers', () => {
    it('INVALID: {message: 123} => throws validation error', () => {
      expect(() =>
        bootFailureMarkerContract.parse({ message: 123, atMs: 1_700_000_000_000 }),
      ).toThrow(/Expected string/u);
    });

    it('INVALID: {missing atMs} => throws validation error', () => {
      expect(() => bootFailureMarkerContract.parse({ message: 'boot failed' })).toThrow(
        /Required/u,
      );
    });
  });
});
