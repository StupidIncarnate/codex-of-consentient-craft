// PURPOSE: Proxy for until-buffer-match-layer-broker — builds the `readSince` collaborator over a
// fixed list of buffer lines, the `matches`/`buildReading` collaborators `stepUntilBroker` would
// otherwise build inline (kept here so a test file carries no conditional of its own — banned by
// jest/no-conditional-in-test), and stages Date.now ONLY when a test needs a controlled elapsed
// figure.
// USAGE: const proxy = untilBufferMatchLayerBrokerProxy(); const { readSince } = proxy.linesAnswering({ lines: [...] });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

type ContentText = ReturnType<typeof ContentTextStub>;

export const untilBufferMatchLayerBrokerProxy = (): {
  linesAnswering: (params: { lines: readonly string[] }) => {
    readSince: (params: { fromIndex: number }) => readonly ContentText[];
  };
  stageElapsedMs: (params: { nowMs: number }) => void;
  matchesNetwork: (params: {
    method: string;
    pathIncludes: string;
  }) => (parsed: Record<PropertyKey, unknown>) => boolean;
  matchesConsoleIncluding: (params: {
    substring: string;
  }) => (parsed: Record<PropertyKey, unknown>) => boolean;
  buildNetworkAnsweredReading: () => (params: {
    parsed: Record<PropertyKey, unknown>;
    waitedMs: number;
  }) => ContentText;
  buildConsoleArrivedReading: (params: {
    pattern: string;
  }) => (params2: { parsed: Record<PropertyKey, unknown>; waitedMs: number }) => ContentText;
} => ({
  linesAnswering: ({
    lines,
  }: {
    lines: readonly string[];
  }): { readSince: (params: { fromIndex: number }) => readonly ContentText[] } => {
    const allLines = lines.map((value) => ContentTextStub({ value }));
    return {
      readSince: ({ fromIndex }: { fromIndex: number }): readonly ContentText[] =>
        allLines.slice(fromIndex),
    };
  },

  // Every call to Date.now() anywhere in this test answers `nowMs` — the broker's only calls to
  // it are the success reading's elapsed figure and the ceiling check, so one fixed value pins
  // both.
  stageElapsedMs: ({ nowMs }: { nowMs: number }): void => {
    registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(nowMs);
  },

  matchesNetwork: ({ method, pathIncludes }: { method: string; pathIncludes: string }) => {
    const wantedMethod = method;
    const wantedPath = pathIncludes;
    return (parsed: Record<PropertyKey, unknown>): boolean => {
      const parsedMethod = parsed.method;
      const parsedUrl = parsed.url;
      const methodMatches = parsedMethod === wantedMethod;
      const pathMatches = typeof parsedUrl === 'string' && parsedUrl.includes(wantedPath);
      return methodMatches && pathMatches;
    };
  },

  matchesConsoleIncluding: ({ substring }: { substring: string }) => {
    const wanted = substring;
    return (parsed: Record<PropertyKey, unknown>): boolean => {
      const parsedText = parsed.text;
      return typeof parsedText === 'string' && parsedText.includes(wanted);
    };
  },

  buildNetworkAnsweredReading:
    () =>
    ({
      parsed,
      waitedMs,
    }: {
      parsed: Record<PropertyKey, unknown>;
      waitedMs: number;
    }): ContentText =>
      ContentTextStub({
        value: `answered ${String(parsed.status)} after ${String(waitedMs)}ms`,
      }),

  buildConsoleArrivedReading:
    ({ pattern }: { pattern: string }) =>
    ({
      parsed,
      waitedMs,
    }: {
      parsed: Record<PropertyKey, unknown>;
      waitedMs: number;
    }): ContentText =>
      ContentTextStub({
        value: `console line matching /${pattern}/ arrived after ${String(waitedMs)}ms — "${String(parsed.text)}"`,
      }),
});
