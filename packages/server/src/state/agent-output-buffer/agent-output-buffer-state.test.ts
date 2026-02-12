import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { ProcessIdStub } from '../../contracts/process-id/process-id.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

import { agentOutputBufferState } from './agent-output-buffer-state';
import { agentOutputBufferStateProxy } from './agent-output-buffer-state.proxy';

describe('agentOutputBufferState', () => {
  describe('addLine()', () => {
    describe('new process and slot', () => {
      it('VALID: {new processId, new slotIndex} => creates buffer and stores line', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-add-1' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line = AgentOutputLineStub({ value: 'first line' });

        agentOutputBufferState.addLine({ processId, slotIndex, line });

        const output = agentOutputBufferState.getProcessOutput({ processId });
        const slotLines = output?.get(slotIndex);

        expect(slotLines).toStrictEqual([line]);
      });
    });

    describe('existing process, new slot', () => {
      it('VALID: {existing processId, new slotIndex} => adds second slot buffer', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-add-2' });
        const slot0 = SlotIndexStub({ value: 0 });
        const slot1 = SlotIndexStub({ value: 1 });
        const line0 = AgentOutputLineStub({ value: 'slot 0 line' });
        const line1 = AgentOutputLineStub({ value: 'slot 1 line' });

        agentOutputBufferState.addLine({ processId, slotIndex: slot0, line: line0 });
        agentOutputBufferState.addLine({ processId, slotIndex: slot1, line: line1 });

        const output = agentOutputBufferState.getProcessOutput({ processId });

        expect(output?.get(slot0)).toStrictEqual([line0]);
        expect(output?.get(slot1)).toStrictEqual([line1]);
      });
    });

    describe('existing process and slot', () => {
      it('VALID: {existing processId, existing slotIndex} => appends to buffer', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-add-3' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line1 = AgentOutputLineStub({ value: 'line one' });
        const line2 = AgentOutputLineStub({ value: 'line two' });

        agentOutputBufferState.addLine({ processId, slotIndex, line: line1 });
        agentOutputBufferState.addLine({ processId, slotIndex, line: line2 });

        const output = agentOutputBufferState.getProcessOutput({ processId });

        expect(output?.get(slotIndex)).toStrictEqual([line1, line2]);
      });
    });

    describe('ring buffer overflow', () => {
      it('EDGE: {501 lines added} => drops oldest line, keeps 500', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-overflow' });
        const slotIndex = SlotIndexStub({ value: 0 });

        for (let i = 0; i < 501; i++) {
          agentOutputBufferState.addLine({
            processId,
            slotIndex,
            line: AgentOutputLineStub({ value: `line-${i}` }),
          });
        }

        const output = agentOutputBufferState.getProcessOutput({ processId });
        const slotLines = output?.get(slotIndex);

        expect(slotLines?.length).toBe(500);
        expect(slotLines?.[0]).toBe('line-1');
        expect(slotLines?.[499]).toBe('line-500');
      });

      it('EDGE: {exactly 500 lines} => no lines dropped', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-exact' });
        const slotIndex = SlotIndexStub({ value: 0 });

        for (let i = 0; i < 500; i++) {
          agentOutputBufferState.addLine({
            processId,
            slotIndex,
            line: AgentOutputLineStub({ value: `line-${i}` }),
          });
        }

        const output = agentOutputBufferState.getProcessOutput({ processId });
        const slotLines = output?.get(slotIndex);

        expect(slotLines?.length).toBe(500);
        expect(slotLines?.[0]).toBe('line-0');
        expect(slotLines?.[499]).toBe('line-499');
      });
    });
  });

  describe('flush()', () => {
    describe('empty state', () => {
      it('EMPTY: {no pending lines} => returns empty map', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();

        const result = agentOutputBufferState.flush();

        expect(result.size).toBe(0);
      });
    });

    describe('flush cursor tracking', () => {
      it('VALID: {one line added} => flush returns that line', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-flush-1' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line = AgentOutputLineStub({ value: 'flush me' });

        agentOutputBufferState.addLine({ processId, slotIndex, line });
        const result = agentOutputBufferState.flush();

        const slotLines = result.get(processId)?.get(slotIndex);

        expect(slotLines).toStrictEqual([line]);
      });

      it('VALID: {lines added, flushed, more lines added} => second flush returns only new lines', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-flush-2' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line1 = AgentOutputLineStub({ value: 'first' });
        const line2 = AgentOutputLineStub({ value: 'second' });
        const line3 = AgentOutputLineStub({ value: 'third' });

        agentOutputBufferState.addLine({ processId, slotIndex, line: line1 });
        agentOutputBufferState.addLine({ processId, slotIndex, line: line2 });
        agentOutputBufferState.flush();

        agentOutputBufferState.addLine({ processId, slotIndex, line: line3 });
        const result = agentOutputBufferState.flush();

        const slotLines = result.get(processId)?.get(slotIndex);

        expect(slotLines).toStrictEqual([line3]);
      });

      it('VALID: {flushed twice with no new lines} => second flush returns empty map', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-flush-3' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line = AgentOutputLineStub({ value: 'only once' });

        agentOutputBufferState.addLine({ processId, slotIndex, line });
        agentOutputBufferState.flush();
        const result = agentOutputBufferState.flush();

        expect(result.size).toBe(0);
      });
    });

    describe('multiple processes', () => {
      it('VALID: {two processes with lines} => flush returns lines for both', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId1 = ProcessIdStub({ value: 'proc-multi-1' });
        const processId2 = ProcessIdStub({ value: 'proc-multi-2' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line1 = AgentOutputLineStub({ value: 'from proc 1' });
        const line2 = AgentOutputLineStub({ value: 'from proc 2' });

        agentOutputBufferState.addLine({ processId: processId1, slotIndex, line: line1 });
        agentOutputBufferState.addLine({ processId: processId2, slotIndex, line: line2 });
        const result = agentOutputBufferState.flush();

        expect(result.get(processId1)?.get(slotIndex)).toStrictEqual([line1]);
        expect(result.get(processId2)?.get(slotIndex)).toStrictEqual([line2]);
      });
    });

    describe('multiple slots', () => {
      it('VALID: {two slots with lines} => flush returns lines for both slots', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-slots' });
        const slot0 = SlotIndexStub({ value: 0 });
        const slot1 = SlotIndexStub({ value: 1 });
        const line0 = AgentOutputLineStub({ value: 'slot 0' });
        const line1 = AgentOutputLineStub({ value: 'slot 1' });

        agentOutputBufferState.addLine({ processId, slotIndex: slot0, line: line0 });
        agentOutputBufferState.addLine({ processId, slotIndex: slot1, line: line1 });
        const result = agentOutputBufferState.flush();

        expect(result.get(processId)?.get(slot0)).toStrictEqual([line0]);
        expect(result.get(processId)?.get(slot1)).toStrictEqual([line1]);
      });
    });
  });

  describe('getProcessOutput()', () => {
    describe('existing process', () => {
      it('VALID: {process with lines} => returns slot map', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-get-1' });
        const slotIndex = SlotIndexStub({ value: 0 });
        const line = AgentOutputLineStub({ value: 'get me' });

        agentOutputBufferState.addLine({ processId, slotIndex, line });
        const result = agentOutputBufferState.getProcessOutput({ processId });

        expect(result?.get(slotIndex)).toStrictEqual([line]);
      });
    });

    describe('missing process', () => {
      it('EMPTY: {unknown processId} => returns undefined', () => {
        const proxy = agentOutputBufferStateProxy();
        proxy.setupEmpty();
        const processId = ProcessIdStub({ value: 'proc-unknown' });

        const result = agentOutputBufferState.getProcessOutput({ processId });

        expect(result).toBeUndefined();
      });
    });
  });

  describe('clear()', () => {
    it('VALID: {buffers and pending data} => clears all state', () => {
      const proxy = agentOutputBufferStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'proc-clear' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const line = AgentOutputLineStub({ value: 'clear me' });

      agentOutputBufferState.addLine({ processId, slotIndex, line });
      agentOutputBufferState.clear();

      expect(agentOutputBufferState.getProcessOutput({ processId })).toBeUndefined();
      expect(agentOutputBufferState.flush().size).toBe(0);
    });
  });

  describe('multi-process isolation', () => {
    it('VALID: {two processes} => adding to one does not affect the other', () => {
      const proxy = agentOutputBufferStateProxy();
      proxy.setupEmpty();
      const processId1 = ProcessIdStub({ value: 'proc-iso-1' });
      const processId2 = ProcessIdStub({ value: 'proc-iso-2' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const line1 = AgentOutputLineStub({ value: 'proc 1 line' });

      agentOutputBufferState.addLine({ processId: processId1, slotIndex, line: line1 });

      const output1 = agentOutputBufferState.getProcessOutput({ processId: processId1 });
      const output2 = agentOutputBufferState.getProcessOutput({ processId: processId2 });

      expect(output1?.get(slotIndex)).toStrictEqual([line1]);
      expect(output2).toBeUndefined();
    });

    it('VALID: {clear one process via separate buffer} => other process retains data', () => {
      const proxy = agentOutputBufferStateProxy();
      proxy.setupEmpty();
      const processId1 = ProcessIdStub({ value: 'proc-iso-3' });
      const processId2 = ProcessIdStub({ value: 'proc-iso-4' });
      const slotIndex = SlotIndexStub({ value: 0 });
      const line1 = AgentOutputLineStub({ value: 'proc 1' });
      const line2 = AgentOutputLineStub({ value: 'proc 2' });

      agentOutputBufferState.addLine({ processId: processId1, slotIndex, line: line1 });
      agentOutputBufferState.addLine({ processId: processId2, slotIndex, line: line2 });

      // Flush only clears pending, not buffers
      agentOutputBufferState.flush();

      const output1 = agentOutputBufferState.getProcessOutput({ processId: processId1 });
      const output2 = agentOutputBufferState.getProcessOutput({ processId: processId2 });

      expect(output1?.get(slotIndex)).toStrictEqual([line1]);
      expect(output2?.get(slotIndex)).toStrictEqual([line2]);
    });
  });
});
