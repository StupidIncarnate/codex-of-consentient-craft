import { toolInputGetContentChangesBroker } from './tool-input-get-content-changes-broker';
import { toolInputGetContentChangesBrokerProxy } from './tool-input-get-content-changes-broker.proxy';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import { MultiEditToolInputStub } from '../../../contracts/multi-edit-tool-input/multi-edit-tool-input.stub';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('toolInputGetContentChangesBroker', () => {
  describe('Write tool', () => {
    it('VALID: WriteToolInput with existing file => returns old and new content', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        content: 'New content',
      });

      proxy.setupReadFileSuccess({ content: FileContentsStub({ value: 'Old content' }) });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Old content',
          newContent: 'New content',
        },
      ]);
    });

    it('VALID: WriteToolInput with new file (ENOENT) => returns empty old content and new content', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: FilePathStub({ value: '/test/newfile.txt' }),
        content: 'New file content',
      });

      proxy.setupReadFileNotFound();

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: '',
          newContent: 'New file content',
        },
      ]);
    });

    it('ERROR: WriteToolInput file read error (not ENOENT) => throws error', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = WriteToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        content: 'New content',
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      proxy.setupReadFileError({ error });

      await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });

  describe('Edit tool', () => {
    it('VALID: EditToolInput simple text replacement => returns full file content with changes applied', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        old_string: 'Hello',
        new_string: 'Hi',
      });

      const existingContent = FileContentsStub({ value: 'Hello world!' });
      // Set up mock for TWO file reads: one for oldContent, one for get-full-content
      proxy.setupReadFileSuccess({ content: existingContent });
      proxy.setupReadFileSuccess({ content: existingContent });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello world!',
          newContent: 'Hi world!',
        },
      ]);
    });

    it('BUG: EditToolInput with full file context => should return full file content before and after edit for proper linting', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const existingFileContent = `function test(param: string): void {
  console.log(param);
}`;

      const toolInput = EditToolInputStub({
        file_path: FilePathStub({ value: '/test/example.ts' }),
        old_string: 'function test(param: string): void {',
        new_string: 'function test(param: any): void {',
      });

      const contents = FileContentsStub({ value: existingFileContent });
      // Set up mock for TWO file reads: one for oldContent, one for get-full-content
      proxy.setupReadFileSuccess({ content: contents });
      proxy.setupReadFileSuccess({ content: contents });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: existingFileContent,
          newContent: `function test(param: any): void {
  console.log(param);
}`,
        },
      ]);
    });
  });

  describe('MultiEdit tool', () => {
    it('VALID: MultiEditToolInput with existing file => returns full file before and after changes', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        edits: [
          { old_string: 'Hello', new_string: 'Hi' },
          { old_string: 'world', new_string: 'universe' },
        ],
      });

      const contents = FileContentsStub({ value: 'Hello world' });
      // Set up mock for TWO file reads: one for oldContent, one for get-full-content
      proxy.setupReadFileSuccess({ content: contents });
      proxy.setupReadFileSuccess({ content: contents });

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([
        {
          oldContent: 'Hello world',
          newContent: 'Hi universe',
        },
      ]);
    });

    it('VALID: MultiEditToolInput with new file (ENOENT) => returns empty array', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/newfile.txt' }),
        edits: [{ old_string: 'placeholder', new_string: 'content' }],
      });

      // Set up mock for TWO file reads: both should fail with ENOENT
      proxy.setupReadFileNotFound();
      proxy.setupReadFileNotFound();

      const result = await toolInputGetContentChangesBroker({ toolInput });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: MultiEditToolInput file read error (not ENOENT) => throws error', async () => {
      const proxy = toolInputGetContentChangesBrokerProxy();
      const toolInput = MultiEditToolInputStub({
        file_path: FilePathStub({ value: '/test/file.txt' }),
        edits: [{ old_string: 'Hello', new_string: 'Hi' }],
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      proxy.setupReadFileError({ error });

      await expect(toolInputGetContentChangesBroker({ toolInput })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });
});
