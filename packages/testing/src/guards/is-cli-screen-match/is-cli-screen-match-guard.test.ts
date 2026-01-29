import { isCliScreenMatchGuard } from './is-cli-screen-match-guard';
import { CliScreenNameStub } from '../../contracts/cli-screen-name/cli-screen-name.stub';

describe('isCliScreenMatchGuard', () => {
  describe('screen pattern matching', () => {
    it('VALID: {menu screen output} => returns true', () => {
      const result = isCliScreenMatchGuard({
        frame: 'Add a quest\nRun a quest\nList quests',
        screen: CliScreenNameStub({ value: 'menu' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {add screen output} => returns true', () => {
      const result = isCliScreenMatchGuard({
        frame: 'What would you like to build?',
        screen: CliScreenNameStub({ value: 'add' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {list screen output} => returns true', () => {
      const result = isCliScreenMatchGuard({
        frame: '.dungeonmaster-quests/001-my-quest',
        screen: CliScreenNameStub({ value: 'list' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {answer screen output with question mark} => returns true', () => {
      const result = isCliScreenMatchGuard({
        frame: 'Why hello world?',
        screen: CliScreenNameStub({ value: 'answer' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('ANSI escape code handling', () => {
    it('VALID: {frame with cursor hide ANSI code} => does not falsely detect answer screen', () => {
      // [?25l is hide cursor - should NOT trigger answer detection
      const result = isCliScreenMatchGuard({
        frame: '\u001B[?25lMenu content without question',
        screen: CliScreenNameStub({ value: 'answer' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {frame with ANSI codes and real question} => correctly detects answer screen', () => {
      const result = isCliScreenMatchGuard({
        frame: '\u001B[?25l\u001B[32mWhat is your name?\u001B[0m',
        screen: CliScreenNameStub({ value: 'answer' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {menu with ANSI color codes} => correctly detects menu screen', () => {
      const result = isCliScreenMatchGuard({
        frame: '\u001B[32mAdd\u001B[0m a quest\n\u001B[33mRun\u001B[0m a quest',
        screen: CliScreenNameStub({ value: 'menu' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {list with cursor control codes} => correctly detects list screen', () => {
      const result = isCliScreenMatchGuard({
        frame: '\u001B[?25h\u001B[2J.dungeonmaster-quests/001-test',
        screen: CliScreenNameStub({ value: 'list' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('screen disambiguation', () => {
    it('VALID: {menu text with "quests" word} => does not falsely match list screen', () => {
      // Menu contains "List - List all active quests" but should NOT match as list screen
      const result = isCliScreenMatchGuard({
        frame: 'Add a quest\nRun a quest\nList - List all active quests',
        screen: CliScreenNameStub({ value: 'list' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {actual list screen with quest path} => correctly matches list screen', () => {
      const result = isCliScreenMatchGuard({
        frame: '.dungeonmaster-quests/001-my-quest\n.dungeonmaster-quests/002-another',
        screen: CliScreenNameStub({ value: 'list' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {menu text with "Init" option} => does not falsely match init screen', () => {
      // Menu contains "Init - Initialize dungeonmaster" but should NOT match as init screen
      const result = isCliScreenMatchGuard({
        frame: 'Add\nRun\nList\nInit - Initialize dungeonmaster in project',
        screen: CliScreenNameStub({ value: 'init' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {actual init screen with progress} => correctly matches init screen', () => {
      const result = isCliScreenMatchGuard({
        frame: 'Initializing dungeonmaster...\nInstalling dependencies',
        screen: CliScreenNameStub({ value: 'init' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {init screen showing already present message} => correctly matches init screen', () => {
      const result = isCliScreenMatchGuard({
        frame: 'devDependencies already present in package.json',
        screen: CliScreenNameStub({ value: 'init' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {add screen with question mark in prompt} => does not falsely match answer screen', () => {
      // Add screen shows "What would you like to build?" - should NOT match as answer screen
      const result = isCliScreenMatchGuard({
        frame: 'What would you like to build?\n> _\nPress Enter to submit',
        screen: CliScreenNameStub({ value: 'answer' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {actual answer screen with question} => correctly matches answer screen', () => {
      // Real answer screen has AI-generated question without "What would you like" prefix
      const result = isCliScreenMatchGuard({
        frame: 'Why hello world?\nEnter your answer:',
        screen: CliScreenNameStub({ value: 'answer' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('missing parameters', () => {
    it('INVALID: {missing frame} => returns false', () => {
      const result = isCliScreenMatchGuard({
        screen: CliScreenNameStub({ value: 'menu' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {missing screen} => returns false', () => {
      const result = isCliScreenMatchGuard({
        frame: 'some output',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {non-matching output} => returns false', () => {
      const result = isCliScreenMatchGuard({
        frame: 'random text without markers',
        screen: CliScreenNameStub({ value: 'menu' }),
      });

      expect(result).toBe(false);
    });
  });
});
