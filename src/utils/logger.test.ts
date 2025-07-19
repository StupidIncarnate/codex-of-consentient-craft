import { Logger, Colors, Icons } from './logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    // Reset spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Create logger with default config
    logger = new Logger();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default configuration', () => {
      const logger = new Logger();
      // We can't directly test private config, but we can test behavior
      logger.info('test');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test'));
    });

    it('should accept custom configuration', () => {
      const logger = new Logger({
        useColors: false,
        useIcons: false,
        timestamp: true,
        prefix: 'TEST',
      });

      logger.info('message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] TEST message/));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(Icons.info));
    });
  });

  describe('quest', () => {
    it('should log quest with title and icon', () => {
      logger.quest('Add Authentication');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Quest:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Add Authentication'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.quest));
    });

    it('should log quest with description', () => {
      logger.quest('Add Authentication', 'Implement JWT-based auth');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Implement JWT-based auth'),
      );
    });
  });

  describe('success', () => {
    it('should log success message with icon', () => {
      logger.success('Quest completed!');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Quest completed!'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.success));
    });
  });

  describe('error', () => {
    it('should log error message with icon', () => {
      logger.error('Failed to spawn agent');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to spawn agent'),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.error));
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, expect.stringContaining(error.stack!));
    });
  });

  describe('warn', () => {
    it('should log warning message with icon', () => {
      logger.warn('Ward validation failed');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ward validation failed'),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.warning));
    });
  });

  describe('info', () => {
    it('should log info message with icon', () => {
      logger.info('Loading quest data');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Loading quest data'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.info));
    });
  });

  describe('agent', () => {
    it('should log agent action with icon', () => {
      logger.agent('Pathseeker', 'Analyzing project structure');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pathseeker'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analyzing project structure'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.agent));
    });
  });

  describe('task', () => {
    it('should log task with complete status', () => {
      logger.task('CreateAuthService', 'complete');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Task.*CreateAuthService.*complete/),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.complete));
    });

    it('should log task with in_progress status', () => {
      logger.task('CreateAuthService', 'in_progress');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.progress));
    });

    it('should log task with failed status', () => {
      logger.task('CreateAuthService', 'failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.error));
    });
  });

  describe('phase', () => {
    it('should log discovery phase', () => {
      logger.phase('discovery', 'starting');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Discovery.*phase.*starting/),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.discovery));
    });

    it('should log implementation phase', () => {
      logger.phase('implementation', 'in progress');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Icons.implementation));
    });
  });

  describe('section', () => {
    it('should create section header', () => {
      logger.section('Active Quests');

      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // empty line + 3 lines
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ACTIVE QUESTS'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('═'));
    });
  });

  describe('item', () => {
    it('should create indented list item', () => {
      logger.item('First item');

      expect(consoleLogSpy).toHaveBeenCalledWith('  • First item');
    });

    it('should create multi-level indented item', () => {
      logger.item('Sub-item', 2);

      expect(consoleLogSpy).toHaveBeenCalledWith('    • Sub-item');
    });
  });

  describe('progress', () => {
    it('should create progress bar', () => {
      logger.progress(3, 10, 'Tasks');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Tasks: \[.*\]\s+30%\s+\(3\/10\)/),
      );
    });

    it('should create progress bar without label', () => {
      logger.progress(5, 10);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\]\s+50%\s+\(5\/10\)/));
    });
  });

  describe('table', () => {
    it('should create formatted table', () => {
      logger.table(
        ['Name', 'Status'],
        [
          ['Quest 1', 'Active'],
          ['Quest 2', 'Complete'],
        ],
      );

      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Name'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Status'));
    });

    it('should handle empty cells', () => {
      logger.table(['Col1', 'Col2'], [['Value', '']]);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('clearLine and updateLine', () => {
    it('should clear line', () => {
      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      logger.clearLine();

      expect(writeSpy).toHaveBeenCalledWith('\r\x1b[K');

      writeSpy.mockRestore();
    });

    it('should update line', () => {
      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      logger.updateLine('Loading...');

      expect(writeSpy).toHaveBeenCalledWith('\r\x1b[K');
      expect(writeSpy).toHaveBeenCalledWith('Loading...');

      writeSpy.mockRestore();
    });
  });

  describe('color configuration', () => {
    it('should not use colors when disabled', () => {
      const logger = new Logger({ useColors: false });

      logger.success('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringContaining(Colors.green));
    });

    it('should not use icons when disabled', () => {
      const logger = new Logger({ useIcons: false });

      logger.success('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.not.stringContaining(Icons.success));
    });
  });

  describe('timestamp configuration', () => {
    it('should include timestamp when enabled', () => {
      const logger = new Logger({ timestamp: true });

      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{1,2}:\d{2}:\d{2}.*\]/),
      );
    });
  });

  describe('prefix configuration', () => {
    it('should include prefix when set', () => {
      const logger = new Logger({ prefix: 'QUEST' });

      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('QUEST'));
    });
  });

  describe('bright', () => {
    it('should log with bright formatting', () => {
      logger.bright('Bright message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Bright message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Colors.bright));
    });
  });

  describe('blue', () => {
    it('should log with blue color', () => {
      logger.blue('Blue message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Blue message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Colors.blue));
    });
  });

  describe('yellow', () => {
    it('should log with yellow color', () => {
      logger.yellow('Yellow message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Yellow message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Colors.yellow));
    });
  });

  describe('green', () => {
    it('should log with green color', () => {
      logger.green('Green message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Green message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Colors.green));
    });
  });

  describe('red', () => {
    it('should log with red color', () => {
      logger.red('Red message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Red message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(Colors.red));
    });
  });

  describe('color methods without colors', () => {
    it('should not apply colors when useColors is false', () => {
      const noColorLogger = new Logger({ useColors: false });

      noColorLogger.bright('Test');
      noColorLogger.blue('Test');
      noColorLogger.yellow('Test');
      noColorLogger.green('Test');
      noColorLogger.red('Test');

      // All calls should not contain color codes
      expect(consoleLogSpy).toHaveBeenCalledTimes(5);
      consoleLogSpy.mock.calls.forEach((call) => {
        expect(call[0]).not.toContain(Colors.bright);
        expect(call[0]).not.toContain(Colors.blue);
        expect(call[0]).not.toContain(Colors.yellow);
        expect(call[0]).not.toContain(Colors.green);
        expect(call[0]).not.toContain(Colors.red);
        expect(call[0]).toContain('Test');
      });
    });
  });
});
