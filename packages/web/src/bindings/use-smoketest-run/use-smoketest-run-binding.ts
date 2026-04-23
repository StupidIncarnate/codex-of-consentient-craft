/**
 * PURPOSE: React hook that exposes smoketest run state and a start function; posts via toolingRunSmoketestBroker and streams per-case progress over WebSocket
 *
 * USAGE:
 * const { opened, running, runId, total, currentCase, results, open, close, run } = useSmoketestRunBinding();
 * // Call run({ suite }) to kick a suite and open the drawer
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  smoketestCaseResultContract,
  smoketestRunIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import type {
  SmoketestCaseResult,
  SmoketestRunId,
  SmoketestSuite,
} from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { toolingRunSmoketestBroker } from '../../brokers/tooling/run-smoketest/tooling-run-smoketest-broker';
import { totalCountContract } from '../../contracts/total-count/total-count-contract';
import type { TotalCount } from '../../contracts/total-count/total-count-contract';
import { mergeSmoketestCaseResultTransformer } from '../../transformers/merge-smoketest-case-result/merge-smoketest-case-result-transformer';

type SmoketestCaseId = SmoketestCaseResult['caseId'];
type SmoketestCaseName = SmoketestCaseResult['name'];

type CurrentCase = { caseId: SmoketestCaseId; name: SmoketestCaseName } | null;

export const useSmoketestRunBinding = (): {
  opened: boolean;
  running: boolean;
  runId: SmoketestRunId | null;
  total: TotalCount | null;
  currentCase: CurrentCase;
  results: readonly SmoketestCaseResult[];
  open: () => void;
  close: () => void;
  run: (params: { suite: SmoketestSuite }) => void;
} => {
  const [opened, setOpened] = useState(false);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<SmoketestRunId | null>(null);
  const [total, setTotal] = useState<TotalCount | null>(null);
  const [currentCase, setCurrentCase] = useState<CurrentCase>(null);
  const [results, setResults] = useState<readonly SmoketestCaseResult[]>([]);

  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;
        if (parsed.data.type !== 'smoketest-progress') return;
        if (!runningRef.current) return;

        const incomingRunId: unknown = Reflect.get(parsed.data.payload, 'runId');
        if (typeof incomingRunId === 'string') {
          const parsedRunId = smoketestRunIdContract.safeParse(incomingRunId);
          if (parsedRunId.success) {
            setRunId((prev) => prev ?? parsedRunId.data);
          }
        }

        const phase: unknown = Reflect.get(parsed.data.payload, 'phase');

        if (phase === 'started') {
          const incomingTotal: unknown = Reflect.get(parsed.data.payload, 'total');
          const parsedTotal = totalCountContract.safeParse(incomingTotal);
          if (parsedTotal.success) {
            setTotal(parsedTotal.data);
          }
          return;
        }

        if (phase === 'case-started') {
          const parsedStart = smoketestCaseResultContract
            .pick({ caseId: true, name: true })
            .safeParse(parsed.data.payload);
          if (parsedStart.success) {
            setCurrentCase({ caseId: parsedStart.data.caseId, name: parsedStart.data.name });
          }
          return;
        }

        if (phase === 'case-complete') {
          const rawResult: unknown = Reflect.get(parsed.data.payload, 'caseResult');
          const caseResult = smoketestCaseResultContract.safeParse(rawResult);
          if (caseResult.success) {
            setResults((prev) =>
              mergeSmoketestCaseResultTransformer({ existing: prev, incoming: caseResult.data }),
            );
            setCurrentCase(null);
          }
          return;
        }

        if (phase === 'complete') {
          setCurrentCase(null);
        }
      },
    });

    return (): void => {
      connection.close();
    };
  }, []);

  const run = useCallback(({ suite }: { suite: SmoketestSuite }): void => {
    if (runningRef.current) {
      setOpened(true);
      return;
    }
    setRunning(true);
    setOpened(true);
    setResults([]);
    setRunId(null);
    setTotal(null);
    setCurrentCase(null);
    toolingRunSmoketestBroker({ suite })
      .then(({ runId: incomingId, results: incomingResults }) => {
        setRunId(incomingId);
        setResults((prev) =>
          incomingResults.reduce<readonly SmoketestCaseResult[]>(
            (acc, incoming) => mergeSmoketestCaseResultTransformer({ existing: acc, incoming }),
            prev,
          ),
        );
      })
      .catch((error: unknown) => {
        globalThis.console.error('[use-smoketest-run]', error);
      })
      .finally(() => {
        setRunning(false);
        setCurrentCase(null);
      });
  }, []);

  const open = useCallback((): void => {
    setOpened(true);
  }, []);
  const close = useCallback((): void => {
    setOpened(false);
  }, []);

  return { opened, running, runId, total, currentCase, results, open, close, run };
};
