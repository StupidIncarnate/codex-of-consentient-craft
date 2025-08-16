export class ProgressIndicator {
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentMessage: string = '';
  private isRunning = false;

  start(message: string): void {
    if (this.isRunning) {
      this.stop(false);
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.currentMessage = message;
    this.currentFrame = 0;

    // Hide cursor for cleaner display
    process.stdout.write('\x1B[?25l');

    // Initial render
    this.render();

    // Start animation
    this.intervalId = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.spinnerFrames.length;
      this.render();
    }, 100);
  }

  update(message: string): void {
    if (!this.isRunning) return;
    this.currentMessage = message;
    this.render();
  }

  private render(): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const spinner = this.spinnerFrames[this.currentFrame];

    // Clear line and render
    process.stdout.write(`\r\x1b[K${spinner} ${this.currentMessage} (${elapsed}s)`);
  }

  stop(success: boolean, finalMessage?: string): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const icon = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const message = finalMessage || this.currentMessage;

    // Clear line, show result, restore cursor
    process.stdout.write(`\r\x1b[K${icon} ${message} (${elapsed}s)\n`);
    process.stdout.write('\x1B[?25h');
  }

  succeed(message?: string): void {
    this.stop(true, message);
  }

  fail(message?: string): void {
    this.stop(false, message);
  }

  // Clean up on process exit
  cleanup(): void {
    if (this.isRunning) {
      this.stop(false, 'Interrupted');
    }
  }
}

// Singleton instance
export const progress = new ProgressIndicator();

// Handle cleanup on exit
process.on('exit', () => progress.cleanup());
process.on('SIGINT', () => {
  progress.cleanup();
  process.exit(1);
});
