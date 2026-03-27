import { devLogEventFormatTransformer } from './dev-log-event-format-transformer';

describe('devLogEventFormatTransformer', () => {
  describe('chat-output events', () => {
    it('VALID: {assistant tool_use Read} => shows tool name and file path', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
          line: JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'Read',
                  input: {
                    file_path: '/home/user/projects/repo/packages/server/src/responders/init.ts',
                  },
                },
              ],
            },
          }),
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:e8c8ba78  assistant/tool_use  Read  .../src/responders/init.ts',
      );
    });

    it('VALID: {assistant tool_use Bash} => shows command preview', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'Bash',
                  input: { command: 'npm run ward -- --only unit' },
                },
              ],
            },
          }),
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:abc12345  assistant/tool_use  Bash  "npm run ward -- --only unit"',
      );
    });

    it('VALID: {assistant tool_use Agent} => shows description', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'Agent',
                  input: { description: 'Implement shared changes' },
                },
              ],
            },
          }),
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:abc12345  assistant/tool_use  Agent  "Implement shared changes"',
      );
    });

    it('VALID: {assistant text} => shows truncated preview', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'Let me read the file.' }],
            },
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  assistant/text  "Let me read the file."');
    });

    it('VALID: {assistant thinking} => shows thinking label', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'assistant',
            message: {
              content: [{ type: 'thinking', thinking: 'some reasoning' }],
            },
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  assistant/thinking');
    });

    it('VALID: {system init} => shows system/init', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({ type: 'system', subtype: 'init' }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  system/init');
    });

    it('VALID: {system hook_started} => shows hook short ID', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'system',
            subtype: 'hook_started',
            hook_id: '9c526043-eaa4-4f13-8bf4-b258db964f6b',
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  system/hook_started  hook:9c526043');
    });

    it('VALID: {user tool_result ok} => shows ok status', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'user',
            message: {
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01abcdef-1111-2222-3333-444444444444',
                  is_error: false,
                },
              ],
            },
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  user/tool_result  01abcdef  ok');
    });

    it('VALID: {user tool_result error} => shows error status', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'user',
            message: {
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'toolu_01abcdef-1111-2222-3333-444444444444',
                  is_error: true,
                },
              ],
            },
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  user/tool_result  01abcdef  error');
    });

    it('VALID: {rate_limit_event allowed} => shows rate_limit status', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'rate_limit_event',
            rate_limit_info: { status: 'allowed' },
          }),
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  rate_limit  allowed');
    });

    it('VALID: {progress hook_progress} => shows hook name', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: JSON.stringify({
            type: 'progress',
            data: { type: 'hook_progress', hookName: 'SessionStart:clear' },
          }),
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:abc12345  progress/hook_progress  SessionStart:clear',
      );
    });

    it('VALID: {pipeline event with slotIndex} => shows slot label', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
          slotIndex: 0,
          entry: {
            raw: JSON.stringify({
              type: 'assistant',
              message: {
                content: [
                  {
                    type: 'tool_use',
                    name: 'mcp__dungeonmaster__signal-back',
                    input: {
                      questId: 'abc12345-dead-beef-cafe-123456789012',
                    },
                  },
                ],
              },
            }),
          },
        },
      });

      expect(result).toBe(
        '◂  chat-output  proc:1925f6f6  slot:0  assistant/tool_use  mcp__dungeonmaster__signal-back  quest:abc12345',
      );
    });

    it('EDGE: {unparseable line} => shows unparseable label', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-output',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          line: 'not-valid-json',
        },
      });

      expect(result).toBe('◂  chat-output  proc:abc12345  (unparseable)');
    });
  });

  describe('non-chat-output events', () => {
    it('VALID: {quest-session-linked} => shows quest and chat IDs', () => {
      const result = devLogEventFormatTransformer({
        type: 'quest-session-linked',
        payload: {
          questId: '89362ba3-918c-4408-aeb1-f8f4ce8400cb',
          chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
        },
      });

      expect(result).toBe('🔗 quest-session-linked  proc:e8c8ba78  quest:89362ba3');
    });

    it('VALID: {chat-history-complete} => shows chat and session IDs', () => {
      const result = devLogEventFormatTransformer({
        type: 'chat-history-complete',
        payload: {
          chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
          sessionId: 'e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
        },
      });

      expect(result).toBe('✓  chat-history-complete  proc:e8c8ba78  session:e8c8ba78');
    });

    it('VALID: {process-failed} => shows fail icon and proc ID', () => {
      const result = devLogEventFormatTransformer({
        type: 'process-failed',
        payload: {
          processId: 'proc-abc12345-1111-2222-3333-444444444444',
        },
      });

      expect(result).toBe('✗  process-failed  proc:abc12345');
    });

    it('VALID: {phase-change with phase} => shows phase value', () => {
      const result = devLogEventFormatTransformer({
        type: 'phase-change',
        payload: {
          processId: 'proc-abc12345-1111-2222-3333-444444444444',
          phase: 'running',
        },
      });

      expect(result).toBe('⚡ phase-change  proc:abc12345  phase:running');
    });

    it('VALID: {clarification-request with questions} => shows question count', () => {
      const result = devLogEventFormatTransformer({
        type: 'clarification-request',
        payload: {
          chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
          questions: ['q1', 'q2', 'q3'],
        },
      });

      expect(result).toBe('?  clarification-request  proc:abc12345  questions:3');
    });
  });
});
