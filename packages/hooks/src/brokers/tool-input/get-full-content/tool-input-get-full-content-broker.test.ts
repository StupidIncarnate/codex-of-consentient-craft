import { toolInputGetFullContentBroker } from './tool-input-get-full-content-broker';
import { toolInputGetFullContentBrokerProxy } from './tool-input-get-full-content-broker.proxy';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import { MultiEditToolInputStub } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input.stub';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('toolInputGetFullContentBroker', () => {
  describe('Write tool', () => {
    it('VALID: WriteToolInput with content => returns content', async () => {
      toolInputGetFullContentBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        content: 'Hello world',
      });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('Hello world');
    });

    it("EDGE: file doesn't exist for Write tool => returns content", async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: FilePathStub({ value: '/test/newfile.txt' }),
        content: 'New file content',
      });

      proxy.setupReadFileNotFound();

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('New file content');
    });
  });

  describe('Edit tool', () => {
    it('VALID: EditToolInput single edit => returns modified content', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        old_string: 'Hello',
        new_string: 'Hi',
      });

      const contents = FileContentsStub({ value: 'Hello world' });
      proxy.setupReadFileSuccess({ contents });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('Hi world');
    });

    it('VALID: EditToolInput with replace_all => returns content with all replacements', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        old_string: 'test',
        new_string: 'demo',
        replace_all: true,
      });

      proxy.setupReadFileSuccess({
        contents: FileContentsStub({ value: 'test file with test content and test data' }),
      });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('demo file with demo content and demo data');
    });

    it("ERROR: file doesn't exist for Edit tool => returns null", async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/nonexistent.txt' }),
        old_string: 'Hello',
        new_string: 'Hi',
      });

      proxy.setupReadFileNotFound();

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBeNull();
    });

    it('ERROR: file read error (not ENOENT) => throws error', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        old_string: 'Hello',
        new_string: 'Hi',
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      proxy.setupReadFileError({ error });

      await expect(toolInputGetFullContentBroker({ toolInput })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });

  describe('MultiEdit tool', () => {
    it('VALID: MultiEditToolInput single edit => returns content with edit applied', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      });

      proxy.setupReadFileSuccess({ contents: FileContentsStub({ value: 'Hello world' }) });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('Hi world');
    });

    it('VALID: MultiEditToolInput multiple edits => returns content with all edits applied', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'world', new_string: 'universe' },
        ],
      });

      proxy.setupReadFileSuccess({ contents: FileContentsStub({ value: 'Hello world' }) });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('Hi universe');
    });

    it('VALID: MultiEditToolInput with replace_all edits => returns content with all replacements', async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        edits: [
          { old_string: 'test', new_string: 'demo', replace_all: true },
          { old_string: 'file', new_string: 'document' },
        ],
      });

      proxy.setupReadFileSuccess({
        contents: FileContentsStub({ value: 'test file with test content in test file' }),
      });

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBe('demo document with demo content in demo file');
    });

    it("ERROR: file doesn't exist for MultiEdit tool => returns null", async () => {
      const proxy = toolInputGetFullContentBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/nonexistent.txt' }),
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      });

      proxy.setupReadFileNotFound();

      const result = await toolInputGetFullContentBroker({ toolInput });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: toolInput with empty file_path => returns null', async () => {
      toolInputGetFullContentBrokerProxy();
      const baseInput = WriteToolInputStub({ content: 'Hello world' });
      const { file_path: _file_path, ...toolInputNoPath } = baseInput;

      const result = await toolInputGetFullContentBroker({
        toolInput: { ...toolInputNoPath, file_path: '' } as never,
      });

      expect(result).toBeNull();
    });
  });
});
