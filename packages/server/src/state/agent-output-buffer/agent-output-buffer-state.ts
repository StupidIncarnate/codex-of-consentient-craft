/**
 * PURPOSE: Ring buffer for accumulating and flushing agent output lines per process per slot
 *
 * USAGE:
 * agentOutputBufferState.addLine({processId, slotIndex, line});
 * const pending = agentOutputBufferState.flush();
 * // Returns Map of processId -> Map of slotIndex -> new lines since last flush
 */

import type { ProcessId } from '../../contracts/process-id/process-id-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import { bufferCursorIndexContract } from '../../contracts/buffer-cursor-index/buffer-cursor-index-contract';
import type { BufferCursorIndex } from '../../contracts/buffer-cursor-index/buffer-cursor-index-contract';

const MAX_LINES_PER_SLOT = 500;

// Ring buffer: stores last MAX_LINES_PER_SLOT agent output lines per process per slot
const buffers = new Map<ProcessId, Map<SlotIndex, AgentOutputLine[]>>();

// Tracks which slots have new lines since last flush (value is the start index of unsent lines)
const pendingFlush = new Map<ProcessId, Map<SlotIndex, BufferCursorIndex>>();

export const agentOutputBufferState = {
  addLine: ({
    processId,
    slotIndex,
    line,
  }: {
    processId: ProcessId;
    slotIndex: SlotIndex;
    line: AgentOutputLine;
  }): void => {
    let processBuffers = buffers.get(processId);
    if (!processBuffers) {
      processBuffers = new Map();
      buffers.set(processId, processBuffers);
    }

    let slotBuffer = processBuffers.get(slotIndex);
    if (!slotBuffer) {
      slotBuffer = [];
      processBuffers.set(slotIndex, slotBuffer);
    }

    slotBuffer.push(line);
    if (slotBuffer.length > MAX_LINES_PER_SLOT) {
      slotBuffer.shift();
    }

    // Mark slot as dirty for batched sending
    let processPending = pendingFlush.get(processId);
    if (!processPending) {
      processPending = new Map();
      pendingFlush.set(processId, processPending);
    }
    if (!processPending.has(slotIndex)) {
      processPending.set(slotIndex, bufferCursorIndexContract.parse(slotBuffer.length - 1));
    }
  },

  flush: (): Map<ProcessId, Map<SlotIndex, AgentOutputLine[]>> => {
    const result = new Map<ProcessId, Map<SlotIndex, AgentOutputLine[]>>();

    for (const [processId, slots] of pendingFlush) {
      for (const [slotIndex, startIdx] of slots) {
        const buffer = buffers.get(processId)?.get(slotIndex);
        if (!buffer) continue;

        const newLines = buffer.slice(startIdx);
        if (newLines.length === 0) continue;

        let processResult = result.get(processId);
        if (!processResult) {
          processResult = new Map();
          result.set(processId, processResult);
        }
        processResult.set(slotIndex, newLines);
      }
    }

    pendingFlush.clear();
    return result;
  },

  getProcessOutput: ({
    processId,
  }: {
    processId: ProcessId;
  }): Map<SlotIndex, AgentOutputLine[]> | undefined => buffers.get(processId),

  clear: (): void => {
    buffers.clear();
    pendingFlush.clear();
  },
} as const;
