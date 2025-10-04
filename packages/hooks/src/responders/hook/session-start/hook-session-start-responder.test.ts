import { HookSessionStartResponder } from './hook-session-start-responder';
import { isNewSession } from '../../../contracts/is-new-session/is-new-session';
import { standardsLoadFilesBroker } from '../../../brokers/standards/load-files/standards-load-files-broker';
import { SessionStartHookStub } from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';

jest.mock('../../../contracts/is-new-session/is-new-session');
jest.mock('../../../brokers/standards/load-files/standards-load-files-broker');

describe('HookSessionStartResponder', () => {
  const mockIsNewSession = jest.mocked(isNewSession);
  const mockStandardsLoadFilesBroker = jest.mocked(standardsLoadFilesBroker);

  beforeEach(() => {
    delete process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS;
  });

  describe('New Session', () => {
    it('VALID: {isNew: true, standardsContent: "content"} => returns {shouldOutput: true, content: formatted}', async () => {
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      const standardsContent = '# Project Standards\n\nFollow these guidelines...';

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[NEW SESSION\]/u);
      expect(result.content).toMatch(/<questmaestro-standards>/u);
      expect(result.content).toContain(standardsContent);
      expect(result.content).toContain(
        'Please refer to these standards when writing, reviewing, or suggesting code changes',
      );
      expect(mockIsNewSession).toHaveBeenCalledTimes(1);
      expect(mockIsNewSession).toHaveBeenCalledWith({
        transcriptPath: hookData.transcript_path,
      });
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledWith({
        cwd: hookData.cwd,
      });
    });

    it('EMPTY: {isNew: true, standardsContent: ""} => returns {shouldOutput: false}', async () => {
      const hookData = SessionStartHookStub();

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue('');

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
      expect(mockIsNewSession).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
    });

    it('EMPTY: {isNew: true, standardsContent: "   \\n\\t  "} => returns {shouldOutput: false}', async () => {
      const hookData = SessionStartHookStub();

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue('   \n\t  ');

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
      expect(mockIsNewSession).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
    });
  });

  describe('Resumed Session', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: undefined} => returns {shouldOutput: false}', async () => {
      const hookData = SessionStartHookStub();

      mockIsNewSession.mockResolvedValue(false);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
      expect(mockIsNewSession).toHaveBeenCalledTimes(1);
      expect(mockIsNewSession).toHaveBeenCalledWith({
        transcriptPath: hookData.transcript_path,
      });
      expect(mockStandardsLoadFilesBroker).not.toHaveBeenCalled();
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "true", standardsContent: "content"} => returns {shouldOutput: true, content: formatted with RESUMED SESSION}', async () => {
      const hookData = SessionStartHookStub({ cwd: '/test/project' });
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';
      const standardsContent = '# Standards content';

      mockIsNewSession.mockResolvedValue(false);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/\[RESUMED SESSION\]/u);
      expect(result.content).toContain(standardsContent);
      expect(mockIsNewSession).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledWith({
        cwd: hookData.cwd,
      });
    });
  });

  describe('Environment Variables', () => {
    it('VALID: {isNew: false, ALWAYS_LOAD: "true"} => loads standards', async () => {
      const hookData = SessionStartHookStub();
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'true';
      const standardsContent = '# Test standards';

      mockIsNewSession.mockResolvedValue(false);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(mockStandardsLoadFilesBroker).toHaveBeenCalledTimes(1);
    });

    it('VALID: {isNew: false, ALWAYS_LOAD: "false"} => returns {shouldOutput: false}', async () => {
      const hookData = SessionStartHookStub();
      process.env.QUESTMAESTRO_ALWAYS_LOAD_STANDARDS = 'false';

      mockIsNewSession.mockResolvedValue(false);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldOutput: false,
      });
      expect(mockStandardsLoadFilesBroker).not.toHaveBeenCalled();
    });
  });

  describe('Standards Content Output', () => {
    it('VALID: output includes XML tags and instructions', async () => {
      const hookData = SessionStartHookStub();
      const standardsContent = 'Test content';

      mockIsNewSession.mockResolvedValue(true);
      mockStandardsLoadFilesBroker.mockResolvedValue(standardsContent);

      const result = await HookSessionStartResponder({ input: hookData });

      expect(result.shouldOutput).toBe(true);
      expect(result.content).toMatch(/<questmaestro-standards>/u);
      expect(result.content).toMatch(/<\/questmaestro-standards>/u);
      expect(result.content).toContain('Test content');
      expect(result.content).toContain(
        'Please refer to these standards when writing, reviewing, or suggesting code changes',
      );
    });
  });
});
