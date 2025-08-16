/**
 * Logger utility for Questmaestro
 * Provides colored console output with quest theming
 */

/**
 * ANSI color codes for terminal output
 */
export const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/**
 * Quest-themed icons
 */
export const Icons = {
  quest: '⚔️',
  success: '✨',
  error: '💀',
  warning: '⚠️',
  info: 'ℹ️',
  agent: '🧙',
  task: '📜',
  complete: '✅',
  blocked: '🚫',
  progress: '⏳',
  discovery: '🔍',
  implementation: '🔨',
  testing: '🧪',
  review: '📝',
  abandoned: '🗑️',
} as const;

/**
 * Logger configuration
 */
export interface LoggerConfig {
  useColors: boolean;
  useIcons: boolean;
  timestamp: boolean;
  prefix?: string;
}

/**
 * Logger class for quest-themed output
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      useColors: process.stdout.isTTY ?? true,
      useIcons: true,
      timestamp: false,
      ...config,
    };
  }

  /**
   * Format a message with optional color
   */
  private format(message: string, color?: string) {
    if (this.config.useColors && color) {
      return `${color}${message}${Colors.reset}`;
    }
    return message;
  }

  /**
   * Add prefix and timestamp to message
   */
  private prepareMessage(message: string, icon?: string) {
    const parts: string[] = [];

    if (this.config.timestamp) {
      const timestamp = new Date().toLocaleTimeString();
      parts.push(this.format(`[${timestamp}]`, Colors.dim));
    }

    if (this.config.prefix) {
      parts.push(this.format(this.config.prefix, Colors.cyan));
    }

    if (this.config.useIcons && icon) {
      parts.push(icon);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log a quest announcement
   */
  quest(title: string, description?: string) {
    const titleFormatted = this.format(title, Colors.bright + Colors.magenta);
    console.log(this.prepareMessage(`Quest: ${titleFormatted}`, Icons.quest));

    if (description) {
      console.log(this.format(`  ${description}`, Colors.dim));
    }
  }

  /**
   * Log a success message
   */
  success(message: string) {
    const formatted = this.format(message, Colors.green);
    console.log(this.prepareMessage(formatted, Icons.success));
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error) {
    const formatted = this.format(message, Colors.red);
    console.error(this.prepareMessage(formatted, Icons.error));

    if (error && error.stack) {
      console.error(this.format(error.stack, Colors.dim + Colors.red));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string) {
    const formatted = this.format(message, Colors.yellow);
    console.warn(this.prepareMessage(formatted, Icons.warning));
  }

  /**
   * Log an info message
   */
  info(message: string) {
    const formatted = this.format(message, Colors.blue);
    console.log(this.prepareMessage(formatted, Icons.info));
  }

  /**
   * Log an agent action
   */
  agent(agentType: string, action: string) {
    const agentFormatted = this.format(agentType, Colors.bright + Colors.cyan);
    const actionFormatted = this.format(action, Colors.white);
    console.log(this.prepareMessage(`${agentFormatted}: ${actionFormatted}`, Icons.agent));
  }

  /**
   * Log task status
   */
  task(taskName: string, status: 'pending' | 'in_progress' | 'complete' | 'failed' | 'skipped') {
    let statusIcon: string;
    let statusColor: string;

    switch (status) {
      case 'complete':
        statusIcon = Icons.complete;
        statusColor = Colors.green;
        break;
      case 'in_progress':
        statusIcon = Icons.progress;
        statusColor = Colors.yellow;
        break;
      case 'failed':
        statusIcon = Icons.error;
        statusColor = Colors.red;
        break;
      case 'skipped':
        statusIcon = Icons.blocked;
        statusColor = Colors.dim;
        break;
      default:
        statusIcon = Icons.task;
        statusColor = Colors.white;
    }

    const nameFormatted = this.format(taskName, Colors.white);
    const statusFormatted = this.format(status, statusColor);
    console.log(this.prepareMessage(`Task ${nameFormatted}: ${statusFormatted}`, statusIcon));
  }

  /**
   * Log phase transition
   */
  phase(phaseName: 'discovery' | 'implementation' | 'testing' | 'review', status: string) {
    let phaseIcon: string;

    switch (phaseName) {
      case 'discovery':
        phaseIcon = Icons.discovery;
        break;
      case 'implementation':
        phaseIcon = Icons.implementation;
        break;
      case 'testing':
        phaseIcon = Icons.testing;
        break;
      case 'review':
        phaseIcon = Icons.review;
        break;
    }

    const phaseFormatted = this.format(
      phaseName.charAt(0).toUpperCase() + phaseName.slice(1),
      Colors.bright + Colors.blue,
    );
    const statusFormatted = this.format(status, Colors.white);
    console.log(this.prepareMessage(`${phaseFormatted} phase: ${statusFormatted}`, phaseIcon));
  }

  /**
   * Create a section header
   */
  section(title: string) {
    const line = '═'.repeat(50);
    console.log();
    console.log(this.format(line, Colors.dim));
    console.log(this.format(title.toUpperCase(), Colors.bright + Colors.white));
    console.log(this.format(line, Colors.dim));
  }

  /**
   * Create an indented list item
   */
  item(message: string, indent: number = 1) {
    const spaces = '  '.repeat(indent);
    console.log(`${spaces}• ${message}`);
  }

  /**
   * Create a progress bar
   */
  progress(current: number, total: number, label?: string) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filled = Math.round((current / total) * barLength);
    const empty = barLength - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentageText = `${percentage}%`.padStart(4);

    const barFormatted = this.format(bar, Colors.green);
    const labelText = label ? `${label}: ` : '';

    console.log(`${labelText}[${barFormatted}] ${percentageText} (${current}/${total})`);
  }

  /**
   * Create a table
   */
  table(headers: string[], rows: string[][]) {
    // Calculate column widths
    const columnWidths = headers.map((header, index) => {
      const headerLength = header.length;
      const maxRowLength = Math.max(...rows.map((row) => (row[index] || '').length));
      return Math.max(headerLength, maxRowLength) + 2;
    });

    // Print headers
    const headerRow = headers.map((header, index) => header.padEnd(columnWidths[index])).join('│');
    console.log(this.format(headerRow, Colors.bright));

    // Print separator
    const separator = columnWidths.map((width) => '─'.repeat(width)).join('┼');
    console.log(this.format(separator, Colors.dim));

    // Print rows
    rows.forEach((row) => {
      const rowText = row.map((cell, index) => (cell || '').padEnd(columnWidths[index])).join('│');
      console.log(rowText);
    });
  }

  /**
   * Clear the current line
   */
  clearLine() {
    process.stdout.write('\r\x1b[K');
  }

  /**
   * Update the current line (useful for progress indicators)
   */
  updateLine(message: string) {
    this.clearLine();
    process.stdout.write(message);
  }

  /**
   * Log with bright formatting
   */
  bright(message: string) {
    const formatted = this.format(message, Colors.bright);
    console.log(formatted);
  }

  /**
   * Log with blue color
   */
  blue(message: string) {
    const formatted = this.format(message, Colors.blue);
    console.log(formatted);
  }

  /**
   * Log with yellow color
   */
  yellow(message: string) {
    const formatted = this.format(message, Colors.yellow);
    console.log(formatted);
  }

  /**
   * Log with green color
   */
  green(message: string) {
    const formatted = this.format(message, Colors.green);
    console.log(formatted);
  }

  /**
   * Log with red color
   */
  red(message: string) {
    const formatted = this.format(message, Colors.red);
    console.log(formatted);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();
