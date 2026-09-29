import { unixSocketRequestProxy } from '#gateway/node/net/unix-socket-request/unix-socket-request.proxy';
import { UnixSocketRecordedErrorStub } from '#gateway/node/net/unix-socket-recorded-error/unix-socket-recorded-error.stub';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';

type DriverResponse = ReturnType<typeof DriverResponseStub>;
type ContentText = ReturnType<typeof ContentTextStub>;
type ReadingCount = ReturnType<typeof ReadingCountStub>;

// Every stage is addressed by the test's own socketPath — the exact path `unixSocketRequest`
// connects to — so two instances' sockets stage apart.
export const driverSocketRequestBrokerProxy = (): {
  respondsWith: (params: { socketPath: AbsoluteFilePath; response: DriverResponse }) => void;
  // Answers with a raw line verbatim — for the not-JSON and wrong-shape frames.
  respondsWithRawLine: (params: { socketPath: AbsoluteFilePath; line: string }) => void;
  // No socket file at this path: the connect fails the recorded ENOENT.
  connectFailsNoSocket: (params: { socketPath: AbsoluteFilePath }) => void;
  // A socket file nothing listens on: the connect fails the recorded ECONNREFUSED.
  connectFailsRefused: (params: { socketPath: AbsoluteFilePath }) => void;
  neverResponds: (params: { socketPath: AbsoluteFilePath }) => void;
  // Every request line written to this socket, newline stripped, in call order.
  getRequestLinesFor: (params: { socketPath: AbsoluteFilePath }) => readonly ContentText[];
  // How many connections were opened to this socket, answered or not.
  getConnectionCountFor: (params: { socketPath: AbsoluteFilePath }) => ReadingCount;
} => {
  const socketProxy = unixSocketRequestProxy();

  return {
    respondsWith: ({
      socketPath,
      response,
    }: {
      socketPath: AbsoluteFilePath;
      response: DriverResponse;
    }): void => {
      socketProxy.respondsWith({ socketPath, line: JSON.stringify(response) });
    },

    respondsWithRawLine: ({
      socketPath,
      line,
    }: {
      socketPath: AbsoluteFilePath;
      line: string;
    }): void => {
      socketProxy.respondsWith({ socketPath, line });
    },

    connectFailsNoSocket: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.rejects({
        socketPath,
        error: UnixSocketRecordedErrorStub({ code: 'ENOENT', socketPath }),
      });
    },

    connectFailsRefused: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.rejects({
        socketPath,
        error: UnixSocketRecordedErrorStub({ code: 'ECONNREFUSED', socketPath }),
      });
    },

    neverResponds: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.neverResponds({ socketPath });
    },

    getRequestLinesFor: ({
      socketPath,
    }: {
      socketPath: AbsoluteFilePath;
    }): readonly ContentText[] =>
      socketProxy
        .getRequestLinesFor({ socketPath })
        .map((requestLine) => ContentTextStub({ value: requestLine })),

    getConnectionCountFor: ({ socketPath }: { socketPath: AbsoluteFilePath }): ReadingCount =>
      ReadingCountStub({ value: socketProxy.getConnectionCountFor({ socketPath }) }),
  };
};
