import { createInterface } from 'readline';
import { Readable } from 'stream';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

const isReadableStream = (value: unknown): boolean => value instanceof Readable;

// `createInterface` is ONE handle shared with `tail-file.proxy.ts`, which stages it for the
// EventEmitter streams its own fabricated `createReadStream` hands out. registerMock keys a mock by
// the module a function is imported from, so this proxy registers the raw `readline` export — the
// same one `lineReader` and the tailer call — never a re-export.
//
// Loading this proxy mocks `createInterface` for the whole test file, so the constructor keeps every
// real `Readable` on the REAL `createInterface`, exactly as an unmocked file behaves; reading lines
// off an in-memory stream is no I/O. `passesThroughFor` names a caller's own inputs explicitly — any
// input a real `Readable` check does not cover, or one a sibling proxy's equal-specificity staging
// would otherwise answer.
export const lineReaderProxy = (): {
  passesThroughFor: (params: { input: (value: unknown) => boolean }) => void;
} => {
  const realReadline = requireActual<{ createInterface: typeof createInterface }>({
    module: 'readline',
  });
  const handle = registerMock({ fn: createInterface });
  handle
    .calledWith([{ input: isReadableStream }])
    .implement((options: Parameters<typeof createInterface>[0]) =>
      realReadline.createInterface(options),
    );

  return {
    passesThroughFor: ({ input }: { input: (value: unknown) => boolean }): void => {
      handle
        .calledWith([{ input }])
        .implement((options: Parameters<typeof createInterface>[0]) =>
          realReadline.createInterface(options),
        );
    },
  };
};
