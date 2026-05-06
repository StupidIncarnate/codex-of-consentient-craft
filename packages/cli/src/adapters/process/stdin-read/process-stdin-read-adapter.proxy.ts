import { Readable } from 'stream';

const STDIN_ORIGINAL = Object.getOwnPropertyDescriptor(process, 'stdin');

export const processStdinReadAdapterProxy = (): {
  setupStdin: ({ data }: { data: string }) => void;
  restore: () => void;
} => ({
  setupStdin: ({ data }: { data: string }): void => {
    const stream = Readable.from(Buffer.from(data, 'utf8'));
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      get: () => stream,
    });
  },
  restore: (): void => {
    if (STDIN_ORIGINAL !== undefined) {
      Object.defineProperty(process, 'stdin', STDIN_ORIGINAL);
    }
  },
});
