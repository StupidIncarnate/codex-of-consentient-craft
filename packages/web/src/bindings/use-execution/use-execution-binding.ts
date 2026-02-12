/**
 * PURPOSE: React hook that manages quest execution lifecycle including starting, polling status, and WebSocket updates
 *
 * USAGE:
 * const {processStatus, isRunning, error, startExecution, stopPolling, slotOutputs} = useExecutionBinding();
 * // Returns execution state with controls for starting and monitoring quest execution
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { OrchestrationStatus, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { processStatusBroker } from '../../brokers/process/status/process-status-broker';
import { questStartBroker } from '../../brokers/quest/start/quest-start-broker';
import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import { agentOutputLineContract } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../../contracts/slot-index/slot-index-contract';
import { agentOutputState } from '../../state/agent-output/agent-output-state';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';

const TERMINAL_PHASES = new Set(['complete', 'failed']);

export const useExecutionBinding = (): {
  processStatus: OrchestrationStatus | null;
  isRunning: boolean;
  error: Error | null;
  startExecution: (params: { questId: QuestId }) => Promise<void>;
  stopPolling: () => void;
  slotOutputs: Map<SlotIndex, AgentOutputLine[]>;
} => {
  const [processStatus, setProcessStatus] = useState<OrchestrationStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [slotOutputs, setSlotOutputs] = useState<Map<SlotIndex, AgentOutputLine[]>>(new Map());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processIdRef = useRef<ProcessId | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);

  const stopPolling = useCallback((): void => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const pollStatus = useCallback((): void => {
    if (!processIdRef.current) return;

    processStatusBroker({ processId: processIdRef.current })
      .then((status: OrchestrationStatus) => {
        setProcessStatus(status);
        if (TERMINAL_PHASES.has(status.phase)) {
          stopPolling();
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, [stopPolling]);

  const handleWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    if (parsed.data.type === 'agent-output') {
      const { payload } = parsed.data;
      const rawSlotIndex: unknown = Reflect.get(payload, 'slotIndex');
      const rawLinesList: unknown = Reflect.get(payload, 'lines');
      const slotIndex = slotIndexContract.safeParse(rawSlotIndex);
      const lineArray = Array.isArray(rawLinesList) ? (rawLinesList as unknown[]) : [];
      const lines: AgentOutputLine[] = [];

      for (const line of lineArray) {
        const result = agentOutputLineContract.safeParse(line);
        if (result.success) {
          lines.push(result.data);
        }
      }

      if (slotIndex.success && lines.length > 0) {
        agentOutputState.append({ slotIndex: slotIndex.data, lines });
        setSlotOutputs(agentOutputState.getAll());
      }
    }
  }, []);

  const startExecution = useCallback(
    async ({ questId }: { questId: QuestId }): Promise<void> => {
      setError(null);
      setIsRunning(true);
      agentOutputState.clear();
      setSlotOutputs(new Map());

      const processId = await questStartBroker({ questId });
      processIdRef.current = processId;

      wsRef.current = websocketConnectAdapter({
        url: `ws://${globalThis.location.host}/ws`,
        onMessage: handleWebSocketMessage,
      });

      pollingRef.current = setInterval(() => {
        pollStatus();
      }, webConfigStatics.polling.intervalMs);

      pollStatus();
    },
    [pollStatus, handleWebSocketMessage],
  );

  useEffect(
    () => () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
    [],
  );

  return {
    processStatus,
    isRunning,
    error,
    startExecution,
    stopPolling,
    slotOutputs,
  };
};
