import { isCliScreenMatchGuard } from './is-cli-screen-match-guard';
import { CliScreenNameStub } from '../../contracts/cli-screen-name/cli-screen-name.stub';

describe('isCliScreenMatchGuard', () => {
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
