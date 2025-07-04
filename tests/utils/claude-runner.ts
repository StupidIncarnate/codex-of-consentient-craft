import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  killed?: boolean;
  matchFound?: boolean;
}

interface CommandOptions {
  timeout?: number;
  debug?: boolean;
  killOnMatch?: string;
  streaming?: boolean;
}

interface TestResult {
  command: string;
  args: string;
  output: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface ScenarioStep {
  description: string;
  command: string;
  args?: string;
  options?: CommandOptions;
  assertions?: Assertion[];
  delay?: number;
}

interface Assertion {
  type: 'fileExists' | 'fileContains' | 'questStatus' | 'outputContains';
  path?: string;
  content?: string;
  status?: string;
  questFile?: string;
  message?: string;
}

interface Scenario {
  name: string;
  steps: ScenarioStep[];
}

interface ScenarioResult {
  scenario: string;
  steps: StepResult[];
}

interface StepResult {
  description: string;
  command: string;
  args?: string;
  success: boolean;
  output: string;
  assertions?: AssertionResult[];
}

interface AssertionResult {
  type: string;
  passed: boolean;
  message?: string;
}

interface StreamJsonEvent {
  type: 'system' | 'assistant' | 'user' | 'result' | 'error';
  subtype?: string;
  model?: string;
  message?: {
    content?: Array<{
      type: 'text' | 'tool_use' | 'tool_result';
      text?: string;
      name?: string;
      id?: string;
      input?: any;
      content?: string;
      is_error?: boolean;
      tool_use_id?: string;
    }>;
  };
  parent_tool_use_id?: string;
  result?: string;
  duration_ms?: number;
  total_cost_usd?: number;
}

export class ClaudeE2ERunner {
  private projectDir: string;
  private results: TestResult[];

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.results = [];
  }

  /**
   * Execute a Claude command in headless mode
   * @param command - The slash command to run (e.g., "/questmaestro")
   * @param args - Arguments for the command
   * @param options - Options including streaming
   * @returns Result with stdout, stderr, exitCode
   */
  async executeCommand(command: string, args: string = '', options: CommandOptions = {}): Promise<CommandResult> {
    // If args provided, combine them. Otherwise just use command as the prompt
    const prompt = args ? `${command} ${args}`.trim() : command;
    
    process.stdout.write(`\nExecuting: ${prompt}\n`);
    
    // Always use streaming for E2E tests - we need to see what's happening
    return this.executeCommandWithProgress(prompt, options);
  }

  /**
   * Execute command with REAL streaming - shows each JSON object as it arrives
   */
  private async executeCommandWithProgress(prompt: string, options: CommandOptions = {}): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      // Use stream-json for real streaming with Sonnet
      const cmdArray = ['claude', '-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', 'sonnet'];
      
      const debugMode = options.debug || false;
      
      process.stdout.write(`Running: ${cmdArray.join(' ')}\n`);
      if (debugMode) {
        process.stdout.write(`Debug mode: ON - showing raw JSON\n`);
      }

      // Set up abort controller for timeout
      const controller = new AbortController();
      
      const claudeProcess = spawn(cmdArray[0], cmdArray.slice(1), {
        cwd: this.projectDir,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        signal: controller.signal
      });

      let fullOutput = '';
      const messages: string[] = [];
      let errorOutput = '';
      const startTime = Date.now();
      let finalResult: StreamJsonEvent | null = null;
      let killMatched = false;
      const killPhrase = options.killOnMatch;

      // Create readline interface for line-by-line processing
      const rl = readline.createInterface({
        input: claudeProcess.stdout,
        crlfDelay: Infinity
      });

      // Process each line (JSON object) as it arrives
      rl.on('line', (line: string) => {
        if (!line.trim()) return;
        
        try {
          const json: StreamJsonEvent = JSON.parse(line);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          // In debug mode, show raw JSON as single line first
          if (debugMode) {
            process.stdout.write(`\n[${elapsed}s] RAW: ${line}\n`);
          }
          
          // Extract minimal info from each event type
          let output = '';
          
          switch (json.type) {
            case 'system':
              output = `[${elapsed}s] SYSTEM: ${json.subtype || 'event'} (model: ${json.model || 'unknown'})\n`;
              break;
              
            case 'assistant':
              // Check if this is a sub-agent response
              const isSubAgent = json.parent_tool_use_id ? true : false;
              const prefix = isSubAgent ? '  └─ SUB-AGENT' : 'ASSISTANT';
              
              if (json.message?.content) {
                json.message.content.forEach(item => {
                  if (item.type === 'text' && item.text) {
                    // Show full text, properly formatted
                    const text = item.text.split('\n').map(line => `        ${line}`).join('\n');
                    output = `[${elapsed}s] ${prefix}:\n${text}\n`;
                    messages.push(item.text);
                  } else if (item.type === 'tool_use') {
                    // Show more details about tool use
                    let toolInfo = `${item.name}`;
                    
                    if (item.name === 'Task') {
                      // For Task tool, show the description and first part of prompt
                      const desc = item.input?.description || 'sub-agent';
                      toolInfo += `(${desc})`;
                      output = `[${elapsed}s] ${prefix} → ${toolInfo}\n`;
                      output += `        [Task ID: ${item.id}]\n`;
                      
                      // Show the actual prompt being sent to the sub-agent
                      if (item.input?.prompt) {
                        const promptLines = item.input.prompt.split('\n');
                        const previewLines = promptLines.slice(0, 10);
                        const truncated = promptLines.length > 10;
                        output += `        Prompt:\n`;
                        output += previewLines.map((line: string) => `        │ ${line}`).join('\n');
                        if (truncated) {
                          output += `\n        │ ... (${promptLines.length - 10} more lines)`;
                        }
                        output += '\n';
                      }
                    } else if (item.name === 'TodoWrite') {
                      const todoCount = item.input?.todos?.length || 0;
                      toolInfo += `(${todoCount} todos)`;
                      output = `[${elapsed}s] ${prefix} → ${toolInfo}\n`;
                      // Show todo titles
                      if (item.input?.todos) {
                        item.input.todos.slice(0, 3).forEach((todo: any) => {
                          output += `        • ${todo.content}\n`;
                        });
                        if (item.input.todos.length > 3) {
                          output += `        • ... (${item.input.todos.length - 3} more)\n`;
                        }
                      }
                    } else {
                      const params: string[] = [];
                      if (item.input?.file_path) params.push(item.input.file_path);
                      else if (item.input?.path) params.push(item.input.path);
                      else if (item.input?.pattern) params.push(item.input.pattern);
                      if (params.length > 0) toolInfo += `(${params.join(', ')})`;
                      output = `[${elapsed}s] ${prefix} → ${toolInfo}\n`;
                    }
                  }
                });
              }
              break;
              
            case 'user':
              // Skip sub-agent user messages to prevent JSON bleed-through
              if (json.parent_tool_use_id) {
                break;
              }
              
              if (json.message?.content?.[0]) {
                const content = json.message.content[0];
                if (content.type === 'tool_result') {
                  const isSubAgentResult = json.parent_tool_use_id ? true : false;
                  const resultPrefix = isSubAgentResult ? '  └─ SUB-RESULT' : 'RESULT';
                  
                  // Show first few lines for readability
                  const resultText = content.content || '';
                  const lines = resultText.split('\n');
                  const preview = lines.slice(0, 5).map(line => `        ${line}`).join('\n');
                  const truncated = lines.length > 5;
                  
                  output = `[${elapsed}s] ${resultPrefix}: ${content.is_error ? 'ERROR' : 'OK'}`;
                  if (content.tool_use_id) {
                    output += ` [Tool: ${content.tool_use_id.slice(-8)}]`;
                  }
                  output += `\n${preview}${truncated ? '\n        ...' : ''}\n`;
                }
              }
              break;
              
            case 'result':
              output = `[${elapsed}s] COMPLETE: ${json.subtype || 'done'} (${json.duration_ms}ms, $${json.total_cost_usd || 0})\n`;
              if (json.result) {
                // Show the full result with proper indentation
                const resultText = json.result.split('\n').map(line => `        ${line}`).join('\n');
                output += `\n${resultText}\n`;
              }
              finalResult = json;
              break;
              
            case 'error':
              output = `[${elapsed}s] ERROR: ${(json as any).message || 'Unknown error'}\n`;
              break;
              
            default:
              // Skip unknown types to reduce noise
              break;
          }
          
          if (output) {
            process.stdout.write(output);
            
            // Check for kill phrase if specified
            if (killPhrase && output.includes(killPhrase)) {
              killMatched = true;
              process.stdout.write(`\n[KILL MATCH FOUND: "${killPhrase}"]\n`);
              claudeProcess.kill('SIGTERM');
              return;
            }
          }
          
          // Collect messages for final output (regardless of debug mode)
          if (json.type === 'assistant' && json.message?.content) {
            json.message.content.forEach(item => {
              if (item.type === 'text' && item.text) {
                messages.push(item.text);
                
                // Also check text content for kill phrase
                if (killPhrase && item.text.includes(killPhrase)) {
                  killMatched = true;
                  process.stdout.write(`\n[KILL MATCH FOUND: "${killPhrase}"]\n`);
                  claudeProcess.kill('SIGTERM');
                  return;
                }
              }
            });
          } else if (json.type === 'result') {
            finalResult = json;
          }
          
          fullOutput += line + '\n';
        } catch (e) {
          // Not JSON - plain text
          process.stdout.write(line + '\n');
          fullOutput += line + '\n';
        }
      });

      // Handle stderr
      claudeProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
        const errorMsg = data.toString().trim();
        if (errorMsg) {
          process.stderr.write(`ERROR: ${errorMsg}\n`);
        }
      });

      // Handle close
      claudeProcess.on('close', (code: number | null) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`\nCompleted in ${duration}s\n`);
        
        // Clean up readline interface
        rl.close();
        
        // Use final result if available, otherwise concatenate messages
        let output = '';
        if (finalResult && finalResult.result) {
          output = finalResult.result;
        } else if (messages.length > 0) {
          output = messages.join('\n');
        }
        
        const success = code === 0;
        
        this.results.push({
          command: prompt,
          args: '',
          output,
          timestamp: new Date(),
          success
        });

        resolve({
          stdout: output || fullOutput, // Use fullOutput if no final result
          stderr: errorOutput,
          exitCode: code || 0,
          success: success || killMatched, // Success if killed on match
          killed: killMatched,
          matchFound: killMatched
        });
      });

      // Handle errors
      claudeProcess.on('error', (error: Error) => {
        console.error(`   ❌ Process error: ${error.message}`);
        reject(error);
      });

      // Close stdin to prevent hanging
      claudeProcess.stdin.end();

      // Optional timeout
      if (options.timeout) {
        setTimeout(() => {
          if ((claudeProcess as any).exitCode === null) {
            console.log(`   ⏱️  Timeout (${options.timeout}ms), terminating...`);
            claudeProcess.kill();
          }
        }, options.timeout);
      }
    });
  }

  /**
   * Execute command with streaming output for long-running operations
   */
  async executeCommandStreaming(prompt: string): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const cmdArray = ['claude', '-p', prompt, '--output-format', 'json'];
      console.log(`   📝 Running (streaming): ${cmdArray.join(' ')}`);
      console.log(`   📂 Working directory: ${this.projectDir}`);
      
      // Use shell: true which we confirmed works
      const command = `claude -p "${prompt}" --output-format json --model sonnet`;
      const claudeProcess = spawn(command, [], {
        cwd: this.projectDir,
        env: process.env,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let fullOutput = '';
      let fullError = '';

      claudeProcess.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        fullOutput += chunk;
        
        // Try to show progress
        try {
          const result = JSON.parse(fullOutput);
          if (result.result) {
            const preview = result.result.substring(0, 100);
            console.log(`   📤 Output: ${preview}${result.result.length > 100 ? '...' : ''}`);
          }
        } catch (e) {
          // JSON not complete yet
        }
      });

      claudeProcess.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        fullError += chunk;
        console.error(`   ❌ Error: ${chunk}`);
      });

      claudeProcess.on('close', (code: number | null) => {
        console.log(`   ✓ Process completed with code: ${code}\n`);
        
        let success = false;
        let stdout = '';
        
        try {
          const result = JSON.parse(fullOutput);
          success = result.is_error === false;
          stdout = result.result || '';
        } catch (e) {
          console.error(`   ⚠️  Failed to parse JSON: ${(e as Error).message}`);
          stdout = fullOutput;
        }
        
        this.results.push({
          command: prompt,
          args: '',
          output: stdout,
          timestamp: new Date(),
          success
        });

        resolve({
          stdout,
          stderr: fullError,
          exitCode: code || 0,
          success
        });
      });

      claudeProcess.on('error', (error: Error) => {
        console.error(`   ❌ Process error: ${error.message}`);
        reject(error);
      });

      // Safety timeout
      const timeout = setTimeout(() => {
        if ((claudeProcess as any).exitCode === null) {
          console.log(`   ⏱️  Timeout reached, terminating process...`);
          claudeProcess.kill();
        }
      }, 60000); // 60 second timeout for streaming
      
      // Clear timeout when process closes
      claudeProcess.on('exit', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Parse streaming JSON output from Claude
   */
  parseStreamJSON(output: string): string {
    const lines = output.split('\n').filter(line => line.trim());
    const messages: string[] = [];
    
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.type === 'message' && json.content) {
          messages.push(json.content);
        }
      } catch (e) {
        // Not JSON, include as plain text
        messages.push(line);
      }
    }
    
    return messages.join('\n');
  }

  /**
   * Run a complete quest scenario
   */
  async runQuestScenario(scenario: Scenario): Promise<ScenarioResult> {
    const results: ScenarioResult = {
      scenario: scenario.name,
      steps: []
    };

    for (const step of scenario.steps) {
      // Support options from scenario steps
      const options = step.options || {};
      const result = await this.executeCommand(step.command, step.args || '', options);
      
      const stepResult: StepResult = {
        description: step.description,
        command: step.command,
        args: step.args,
        success: result.success,
        output: result.stdout
      };

      // Run assertions if provided
      if (step.assertions) {
        stepResult.assertions = [];
        for (const assertion of step.assertions) {
          const passed = await this.runAssertion(assertion);
          stepResult.assertions.push({
            type: assertion.type,
            passed,
            message: assertion.message
          });
        }
      }

      results.steps.push(stepResult);

      // Add delay between commands if specified
      if (step.delay) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }
    }

    return results;
  }

  /**
   * Run an assertion against the project state
   */
  async runAssertion(assertion: Assertion): Promise<boolean> {
    switch (assertion.type) {
      case 'fileExists':
        return fs.existsSync(path.join(this.projectDir, assertion.path!));
      
      case 'fileContains':
        if (!fs.existsSync(path.join(this.projectDir, assertion.path!))) {
          return false;
        }
        const content = fs.readFileSync(
          path.join(this.projectDir, assertion.path!), 
          'utf8'
        );
        return content.includes(assertion.content!);
      
      case 'questStatus':
        const trackerPath = path.join(
          this.projectDir, 
          'questmaestro', 
          'quest-tracker.json'
        );
        if (!fs.existsSync(trackerPath)) {
          return false;
        }
        const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
        return tracker[assertion.status!].includes(assertion.questFile!);
      
      case 'outputContains':
        const lastResult = this.results[this.results.length - 1];
        return !!(lastResult && lastResult.output && 
                  lastResult.output.includes(assertion.content!));
      
      default:
        throw new Error(`Unknown assertion type: ${assertion.type}`);
    }
  }

  /**
   * Get all results from this runner
   */
  getResults(): TestResult[] {
    return this.results;
  }
}