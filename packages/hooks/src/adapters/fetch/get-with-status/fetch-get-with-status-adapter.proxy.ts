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
  setupOk: (params: { url: string; body: unknown }) => void;
  setupStatus: (params: { url: string; status: number; body: unknown }) => void;
  setupRawText: (params: { url: string; status: number; text: string }) => void;
  setupNetworkError: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // The URL is the address — two endpoints staged in one test must be told apart by URL, not
    // by which setup call happened to run first.
    setupOk: ({ url, body }: { url: string; body: unknown }): void => {
      handle.calledWith([url]).resolves(
        buildResponse({
          ok: true,
          status: httpStatusStatics.successRange.minInclusive,
          bodyText: JSON.stringify(body),
        }),
      );
    },
    setupStatus: ({ url, status, body }: { url: string; status: number; body: unknown }): void => {
      handle
        .calledWith([url])
        .resolves(
          buildResponse({ ok: isOkStatus({ status }), status, bodyText: JSON.stringify(body) }),
        );
    },
    setupRawText: ({ url, status, text }: { url: string; status: number; text: string }): void => {
      handle
        .calledWith([url])
        .resolves(buildResponse({ ok: isOkStatus({ status }), status, bodyText: text }));
    },
    setupNetworkError: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};
