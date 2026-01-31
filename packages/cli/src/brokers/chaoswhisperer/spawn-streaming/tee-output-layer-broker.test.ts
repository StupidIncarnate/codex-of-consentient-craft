import { teeOutputLayerBroker } from './tee-output-layer-broker';
import { teeOutputLayerBrokerProxy } from './tee-output-layer-broker.proxy';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { SessionIdStub, ExitCodeStub, StepIdStub } from '@dungeonmaster/shared/contracts';

describe('teeOutputLayerBroker()', () => {
  describe('session ID extraction', () => {
    it('VALID: {stream with session_id} => returns extracted session ID', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const sessionId = SessionIdStub();
      const lines = [
        StreamJsonLineStub({ value: JSON.stringify({ type: 'system', session_id: sessionId }) }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
      });
    });

    it('VALID: {stream with multiple session_id lines} => returns first session ID only', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const firstSessionId = SessionIdStub({ value: 'first-session-id-12345' });
      const secondSessionId = SessionIdStub({ value: 'second-session-id-67890' });
      const lines = [
        StreamJsonLineStub({
          value: JSON.stringify({ type: 'system', session_id: firstSessionId }),
        }),
        StreamJsonLineStub({
          value: JSON.stringify({ type: 'system', session_id: secondSessionId }),
        }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: firstSessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
      });
    });

    it('EMPTY: {stream with no session_id} => returns null session ID', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
      });
    });
  });

  describe('signal extraction', () => {
    it('VALID: {stream with signal-back tool call} => returns extracted signal', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const stepId = StepIdStub();
      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId,
                  summary: 'Task completed successfully',
                },
              },
            ],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [signalLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result.signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Task completed successfully',
      });
    });

    it('VALID: {stream with multiple signals} => returns first signal only', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const stepId = StepIdStub();
      const firstSignalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId,
                  summary: 'First signal',
                },
              },
            ],
          },
        }),
      });
      const secondSignalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'partially-complete',
                  stepId,
                  progress: 'Some progress',
                  continuationPoint: 'Continue here',
                },
              },
            ],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [firstSignalLine, secondSignalLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result.signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'First signal',
      });
    });
  });

  describe('tee output', () => {
    it('VALID: {stream with text content} => writes text to stdout', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const textLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello from Claude' }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [textLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('Hello from Claude');
    });

    it('VALID: {stream with multiple text lines} => concatenates text output', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const firstLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'First ' }],
          },
        }),
      });
      const secondLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Second' }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [firstLine, secondLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('First Second');
    });

    it('EMPTY: {stream with no text content} => writes nothing to stdout', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const nonTextLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'system',
          session_id: SessionIdStub(),
        }),
      });
      proxy.setupStreamWithLines({ lines: [nonTextLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('');
    });

    it('VALID: {stream with tool_use content} => writes tool name to stdout', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const toolUseLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Task', input: {} }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [toolUseLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('[Task]\n');
    });

    it('VALID: {stream with text and tool_use in same message} => writes both with newline between', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const mixedLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Let me explore.' },
              { type: 'tool_use', name: 'Glob', input: {} },
            ],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [mixedLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      // Text doesn't end with newline, so newline is prepended before tool
      expect(proxy.getWrittenOutput()).toBe('Let me explore.\n[Glob]\n');
    });
  });

  describe('newline handling', () => {
    it('VALID: {text ending with newline + tool} => no extra newline added', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const textLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Some text\n' }],
          },
        }),
      });
      const toolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Read', input: {} }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [textLine, toolLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('Some text\n[Read]\n');
    });

    it('VALID: {text NOT ending with newline + tool} => adds newline first', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const textLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Some text without newline' }],
          },
        }),
      });
      const toolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Read', input: {} }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [textLine, toolLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('Some text without newline\n[Read]\n');
    });

    it('VALID: {tool after tool} => no extra newline (tools always end with newline)', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const firstToolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Glob', input: {} }],
          },
        }),
      });
      const secondToolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Read', input: {} }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [firstToolLine, secondToolLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('[Glob]\n[Read]\n');
    });

    it('VALID: {first output is tool} => no extra newline needed', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const toolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Task', input: {} }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [toolLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('[Task]\n');
    });

    it('VALID: {tool with input params after text} => shows tool with params on new line', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const textLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Let me search' }],
          },
        }),
      });
      const toolLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Glob', input: { pattern: '*.ts' } }],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [textLine, toolLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(proxy.getWrittenOutput()).toBe('Let me search\n[Glob] pattern="*.ts"\n');
    });
  });

  describe('process exit', () => {
    it('VALID: {process exits with code 0} => returns exit code 0', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
      });
    });

    it('VALID: {process exits with code 1} => returns exit code 1', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: null,
      });
    });

    it('EDGE: {process exits with null code} => returns null exit code', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithNullExit();

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        signal: null,
      });
    });
  });

  describe('process error', () => {
    it('ERROR: {process emits error} => rejects with error', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      proxy.setupEmptyStream();

      const error = new Error('Process failed');
      const processStub = proxy.returnsProcessWithError({ error });

      await expect(
        teeOutputLayerBroker({
          stdout: jest.fn() as never,
          process: processStub,
        }),
      ).rejects.toStrictEqual(error);
    });
  });

  describe('line parsing', () => {
    it('INVALID_LINE: {stream with invalid JSON} => continues and returns result', async () => {
      const proxy = teeOutputLayerBrokerProxy();
      const lines = [
        StreamJsonLineStub({ value: 'not valid json' }),
        StreamJsonLineStub({ value: 'also not valid' }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await teeOutputLayerBroker({
        stdout: jest.fn() as never,
        process: processStub,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
      });
    });
  });
});
