import { folderDetailWasCalledBroker } from './folder-detail-was-called-broker';
import { folderDetailWasCalledBrokerProxy } from './folder-detail-was-called-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';

const TRANSCRIPT_PATH = FilePathStub({ value: '/tmp/transcript.jsonl' });
const BROKERS_FOLDER_TYPE = FolderTypeStub({ value: 'brokers' });

const matchingLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'mcp__dungeonmaster__get-folder-detail',
        input: { folderType: 'brokers' },
      },
    ],
  },
});

const differentFolderTypeLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'mcp__dungeonmaster__get-folder-detail',
        input: { folderType: 'contracts' },
      },
    ],
  },
});

const bareNameLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'get-folder-detail',
        input: { folderType: 'brokers' },
      },
    ],
  },
});

const contentIsStringLine = JSON.stringify({
  type: 'user',
  message: { role: 'user', content: 'remember to call get-folder-detail before writing' },
});

const noMessageLine = JSON.stringify({
  type: 'system',
  note: 'see get-folder-detail tool for details',
});

const tornLine = '{"type":"assistant","message":{"content":[{"broken get-folder-detail json';

const unrelatedToolLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'toolu_9', name: 'Read', input: { file_path: '/tmp/a.ts' } }],
  },
});

const plainTextLine = JSON.stringify({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'text', text: 'Let me look at that file.' }] },
});

describe('folderDetailWasCalledBroker', () => {
  it('VALID: {transcript with a matching get-folder-detail call for the requested folderType} => returns called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({ transcriptFilePath: TRANSCRIPT_PATH, contents: matchingLine });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('called');
  });

  it('VALID: {transcript with a get-folder-detail call for a different folderType only} => returns not-called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: differentFolderTypeLine,
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('not-called');
  });

  it('EDGE: {matching call is not the first candidate line} => returns called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [differentFolderTypeLine, matchingLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('called');
  });

  it('EDGE: {only the bare unnamespaced tool name appears} => returns not-called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({ transcriptFilePath: TRANSCRIPT_PATH, contents: bareNameLine });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('not-called');
  });

  it('EDGE: {a torn line mixed with a good matching line} => returns called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [tornLine, matchingLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('called');
  });

  it('EDGE: {a torn line mixed with a valid non-matching line} => returns not-called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [tornLine, differentFolderTypeLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('not-called');
  });

  it('EDGE: {a line whose content is a string and a line with no message} => returns not-called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [contentIsStringLine, noMessageLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('not-called');
  });

  it('VALID: {transcript whose lines never mention get-folder-detail at all} => returns not-called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [plainTextLine, unrelatedToolLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('not-called');
  });

  it('VALID: {ordinary lines plus a matching call} => returns called', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [plainTextLine, unrelatedToolLine, matchingLine].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('called');
  });

  it('EMPTY: {empty file} => returns undetermined', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({ transcriptFilePath: TRANSCRIPT_PATH, contents: '' });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('undetermined');
  });

  it('ERROR: {all-garbage file} => returns undetermined', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupTranscript({
      transcriptFilePath: TRANSCRIPT_PATH,
      contents: [
        '{{{ not valid json, get-folder-detail garbage',
        '[[[ also garbage mentioning get-folder-detail',
      ].join('\n'),
    });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('undetermined');
  });

  it('ERROR: {transcript read rejects} => returns undetermined', async () => {
    const proxy = folderDetailWasCalledBrokerProxy();
    proxy.setupReadError({ transcriptFilePath: TRANSCRIPT_PATH });

    const result = await folderDetailWasCalledBroker({
      transcriptFilePath: TRANSCRIPT_PATH,
      folderType: BROKERS_FOLDER_TYPE,
    });

    expect(result).toBe('undetermined');
  });
});
