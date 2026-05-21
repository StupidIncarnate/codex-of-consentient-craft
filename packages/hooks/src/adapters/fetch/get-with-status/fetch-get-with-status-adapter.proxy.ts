import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

const isOkStatus = ({ status }: { status: number }): boolean =>
  status >= httpStatusStatics.successRange.minInclusive &&
  status < httpStatusStatics.successRange.maxExclusive;

const buildResponse = ({
  ok,
  status,
  bodyText,
}: {
  ok: boolean;
  status: number;
  bodyText: string;
}): Response =>
  ({
    ok,
    status,
    text: async () => Promise.resolve(bodyText),
  }) as never;

export const fetchGetWithStatusAdapterProxy = (): {
  setupOk: (params: { body: unknown }) => void;
  setupStatus: (params: { status: number; body: unknown }) => void;
  setupRawText: (params: { status: number; text: string }) => void;
  setupNetworkError: (params: { error: Error }) => void;
  getLastCallUrl: () => unknown;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });
  handle.mockResolvedValue(
    buildResponse({
      ok: true,
      status: httpStatusStatics.successRange.minInclusive,
      bodyText: 'null',
    }),
  );

  return {
    setupOk: ({ body }: { body: unknown }): void => {
      handle.mockResolvedValueOnce(
        buildResponse({
          ok: true,
          status: httpStatusStatics.successRange.minInclusive,
          bodyText: JSON.stringify(body),
        }),
      );
    },
    setupStatus: ({ status, body }: { status: number; body: unknown }): void => {
      handle.mockResolvedValueOnce(
        buildResponse({ ok: isOkStatus({ status }), status, bodyText: JSON.stringify(body) }),
      );
    },
    setupRawText: ({ status, text }: { status: number; text: string }): void => {
      handle.mockResolvedValueOnce(
        buildResponse({ ok: isOkStatus({ status }), status, bodyText: text }),
      );
    },
    setupNetworkError: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getLastCallUrl: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      return lastCall?.[0];
    },
  };
};
