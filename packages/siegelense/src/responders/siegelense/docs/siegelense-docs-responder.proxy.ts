/**
 * PURPOSE: Test proxy for SiegelenseDocsResponder. It mocks ONE boundary and nothing else —
 * `process.stdout.write` — because this responder reaches no broker and no adapter: the compose and
 * render transformers run real, so every assertion a test makes lands on the manual's actual prose
 * rather than on a staged stand-in for it. `getStdoutLines` exists beside `getStdoutWrites` because
 * the human rendering is one multi-line write, and asserting a rendered heading against its own
 * line is the only way to prove the TEXT form was taken rather than the JSON one.
 *
 * USAGE:
 * const proxy = SiegelenseDocsResponderProxy();
 * await SiegelenseDocsResponder({ scope: DocsScopeStub({ value: 'fixing' }), isJson: false });
 * proxy.getStdoutLines();
 */

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const SiegelenseDocsResponderProxy = (): {
  getStdoutWrites: () => unknown[];
  getStdoutLines: () => unknown[];
} => {
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),

    getStdoutLines: (): unknown[] =>
      stdoutHandle
        .callsMatching([])
        .map((call) => call[0])
        .flatMap((written) => String(written).split('\n')),
  };
};
