import { HookPreFolderDetailResponder } from './hook-pre-folder-detail-responder';
import { HookPreFolderDetailResponderProxy } from './hook-pre-folder-detail-responder.proxy';
import { FolderDetailHookDataStub } from '../../../contracts/folder-detail-hook-data/folder-detail-hook-data.stub';
import { folderDetailBlockMessageStatics } from '../../../statics/folder-detail-block-message/folder-detail-block-message-statics';

const BROKER_FILE_PATH = 'packages/hooks/src/brokers/x/x-broker.ts';
const OUTSIDE_FOLDER_TYPE_FILE_PATH = 'packages/hooks/src/not-a-folder-type/x/x-file.ts';
const TRANSCRIPT_PATH = '/tmp/session123.jsonl';
const SUBAGENT_TRANSCRIPT_PATH = '/tmp/session123/subagents/agent-abc123.jsonl';

const BLOCK_MESSAGE = `${folderDetailBlockMessageStatics.header}\n\nCall get-folder-detail({ folderType: "brokers" }) now.\n\n${folderDetailBlockMessageStatics.rule}\n\n${folderDetailBlockMessageStatics.footer}`;

describe('HookPreFolderDetailResponder', () => {
  describe('blocks: folder-detail never called this session', () => {
    it('VALID: {folderType not called} => blocks with the exact folder-detail message', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupNeverCalled({ transcriptPath: TRANSCRIPT_PATH, folderType: 'brokers' });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: BLOCK_MESSAGE,
      });
    });
  });

  describe('allows: folder-detail already called this session', () => {
    it('VALID: {folderType already called} => does not block', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupAlreadyCalled({ transcriptPath: TRANSCRIPT_PATH, folderType: 'brokers' });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('allows: lookup could not be determined', () => {
    it('EDGE: {transcript read fails} => does not block', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupUndetermined({ transcriptPath: TRANSCRIPT_PATH });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('allows: transcript does not resolve', () => {
    it('EDGE: {transcript file does not exist} => does not block', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupNoTranscript({ transcriptPath: TRANSCRIPT_PATH });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('allows: tool is not Write', () => {
    it('VALID: {tool_name: "Edit"} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Edit',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });

    it('VALID: {tool_name: "MultiEdit"} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'MultiEdit',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('allows: path is not inside a known folder type', () => {
    it('VALID: {file_path outside packages/*/src/<folderType>/} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: OUTSIDE_FOLDER_TYPE_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('allows: payload fails the contract', () => {
    it('INVALID: {input: {}} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({ input: {} });

      expect(result).toStrictEqual({ shouldBlock: false });
    });

    it('INVALID: {input: "not an object"} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({ input: 'not an object' });

      expect(result).toStrictEqual({ shouldBlock: false });
    });

    it('INVALID: {input: null} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({ input: null });

      expect(result).toStrictEqual({ shouldBlock: false });
    });

    it('INVALID: {hook_event_name: "SessionStart"} => does not block', async () => {
      HookPreFolderDetailResponderProxy();

      const result = await HookPreFolderDetailResponder({
        input: {
          hook_event_name: 'SessionStart',
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
        },
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });
  });

  describe('sub-agent caller: judged by its own transcript, never the parent', () => {
    it('VALID: {agent_id present, its own transcript records the call} => does not block', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupAlreadyCalled({
        transcriptPath: SUBAGENT_TRANSCRIPT_PATH,
        folderType: 'brokers',
      });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
          agent_id: 'abc123',
        }),
      });

      expect(result).toStrictEqual({ shouldBlock: false });
    });

    it('VALID: {agent_id present, its own transcript does not record the call} => blocks', async () => {
      const proxy = HookPreFolderDetailResponderProxy();
      proxy.setupNeverCalled({
        transcriptPath: SUBAGENT_TRANSCRIPT_PATH,
        folderType: 'brokers',
      });

      const result = await HookPreFolderDetailResponder({
        input: FolderDetailHookDataStub({
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE_PATH },
          transcript_path: TRANSCRIPT_PATH,
          agent_id: 'abc123',
        }),
      });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: BLOCK_MESSAGE,
      });
    });
  });
});
