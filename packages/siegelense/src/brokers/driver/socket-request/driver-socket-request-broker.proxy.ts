import { unixSocketRequestProxy } from '#gateway/node/net/unix-socket-request/unix-socket-request.proxy';
import { UnixSocketRecordedErrorStub } from '#gateway/node/net/unix-socket-recorded-error/unix-socket-recorded-error.stub';

import type { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';

type DriverResponse = ReturnType<typeof DriverResponseStub>;
type ContentText = string;
type ReadingCount = number;

// Every stage is addressed by the test's own socketPath — the exact path `unixSocketRequest`
// connects to — so two instances' sockets stage apart.
export const driverSocketRequestBrokerProxy = (): {
  respondsWith: (params: { socketPath: string; response: DriverResponse }) => void;
  // Answers with a raw line verbatim — for the not-JSON and wrong-shape frames.
  respondsWithRawLine: (params: { socketPath: string; line: string }) => void;
  // No socket file at this path: the connect fails the recorded ENOENT.
  connectFailsNoSocket: (params: { socketPath: string }) => void;
  // A socket file nothing listens on: the connect fails the recorded ECONNREFUSED.
  connectFailsRefused: (params: { socketPath: string }) => void;
  neverResponds: (params: { socketPath: string }) => void;
  // Every request line written to this socket, newline stripped, in call order.
  getRequestLinesFor: (params: { socketPath: string }) => readonly ContentText[];
  // How many connections were opened to this socket, answered or not.
  getConnectionCountFor: (params: { socketPath: string }) => ReadingCount;
} => {
  const socketProxy = unixSocketRequestProxy();

  return {
    respondsWith: ({
      socketPath,
      response,
    }: {
      socketPath: string;
      response: DriverResponse;
    }): void => {
      socketProxy.respondsWith({ socketPath, line: JSON.stringify(response) });
    },

    respondsWithRawLine: ({
      socketPath,
      line,
    }: {
      socketPath: string;
      line: string;
    }): void => {
      socketProxy.respondsWith({ socketPath, line });
    },

    connectFailsNoSocket: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.rejects({
        socketPath,
        error: UnixSocketRecordedErrorStub({ code: 'ENOENT', socketPath }),
      });
    },

    connectFailsRefused: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.rejects({
        socketPath,
        error: UnixSocketRecordedErrorStub({ code: 'ECONNREFUSED', socketPath }),
      });
    },

    neverResponds: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.neverResponds({ socketPath });
    },

    getRequestLinesFor: ({
      socketPath,
    }: {
      socketPath: string;
    }): readonly ContentText[] =>
      socketProxy
        .getRequestLinesFor({ socketPath })
        .map((requestLine) => requestLine),

    getConnectionCountFor: ({ socketPath }: { socketPath: string }): ReadingCount =>
      socketProxy.getConnectionCountFor({ socketPath }),
  };
};
