import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const fetchOkProxy = (): {
  setupReachable: (params: { url: string }) => void;
  setupServerError: (params: { url: string }) => void;
  setupClientError: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupAborted: (params: { url: string }) => void;
  setupUnexpectedError: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    // Keyed on the URL (fetch's first argument) — a prefix match, so the real call's second
    // `{signal}` argument does not need describing here.
    setupReachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: true, status: 200 } as Response);
    },
    setupServerError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 500 } as Response);
    },
    setupClientError: ({ url }: { url: string }): void => {
      handle.calledWith([url]).resolves({ ok: false, status: 404 } as Response);
    },
    setupUnreachable: ({ url }: { url: string }): void => {
      handle.calledWith([url]).rejects(new Error('connect ECONNREFUSED'));
    },
    setupAborted: ({ url }: { url: string }): void => {
      handle
        .calledWith([url])
        .rejects(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }));
    },
    setupUnexpectedError: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};
