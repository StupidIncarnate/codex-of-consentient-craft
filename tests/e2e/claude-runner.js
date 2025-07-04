const { execSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ClaudeE2ERunner {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.results = [];
  }

  /**
   * Execute a Claude command in headless mode
   * @param {string} command - The slash command to run (e.g., "/questmaestro")
   * @param {string} args - Arguments for the command
   * @param {object} options - Options including streaming
   * @returns {object} Result with stdout, stderr, exitCode
   */
  async executeCommand(command, args = '', options = {}) {
    // If args provided, combine them. Otherwise just use command as the prompt
    const prompt = args ? `${command} ${args}`.trim() : command;
    
    console.log(`\n🎯 Executing: ${prompt}`);
    
    // Use progress indicator for long-running commands
    if (options.streaming) {
      return this.executeCommandWithProgress(prompt, options);
    }
    
    // Default non-streaming implementation
    try {
      const cmdStr = `claude -p "${prompt}" --output-format json`;
      console.log(`   📝 Running: ${cmdStr}`);
      console.log(`   📂 Working directory: ${this.projectDir}`);

      const output = execSync(cmdStr, {
        encoding: 'utf8',
        timeout: options.timeout || 25000,
        cwd: this.projectDir,
        env: process.env
      });

      const result = JSON.parse(output);
      const success = result.is_error === false;
      const stdout = result.result || '';
      
      // Show Claude's actual response
      if (stdout) {
        console.log(`   💬 Claude says: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      }
      console.log(`   ✓ Completed successfully\n`);
      
      this.results.push({
        command,
        args,
        output: stdout,
        timestamp: new Date(),
        success
      });

      return {
        stdout,
        stderr: '',
        exitCode: success ? 0 : 1,
        success
      };
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      
      this.results.push({
        command,
        args,
        error: error.message,
        timestamp: new Date(),
        success: false
      });

      return {
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        success: false
      };
    }
  }

  /**
   * Execute command with REAL streaming - shows each JSON object as it arrives
   */
  async executeCommandWithProgress(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      // Use stream-json for real streaming
      const cmdArray = ['claude', '-p', prompt, '--output-format', 'stream-json', '--verbose'];
      
      console.log(`   📝 Running (STREAMING): ${cmdArray.join(' ')}`);
      console.log(`   📂 Working directory: ${this.projectDir}`);
      console.log(`   🔄 Stream mode: JSON objects appear as they arrive\n`);

      const claudeProcess = spawn(cmdArray[0], cmdArray.slice(1), {
        cwd: this.projectDir,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let fullOutput = '';
      let messages = [];
      let errorOutput = '';
      let startTime = Date.now();
      let finalResult = null;

      // Create readline interface for line-by-line processing
      const rl = readline.createInterface({
        input: claudeProcess.stdout,
        crlfDelay: Infinity
      });

      // Process each line (JSON object) as it arrives
      rl.on('line', (line) => {
        if (!line.trim()) return;
        
        try {
          const json = JSON.parse(line);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          // Extract only the properties we care about
          const filtered = {
            type: json.type,
            ...(json.subtype && { subtype: json.subtype }),
            ...(json.role && { role: json.role }),
            ...(json.model && { model: json.model }),
            ...(json.content && { content: json.content }),
            ...(json.result && { result: json.result })
          };
          
          // Handle different streaming event types
          const icon = {
            message: '💬',
            content: '📝',
            status: 'ℹ️',
            tool_use: '🔧',
            result: '✅',
            system: '🔄',
            assistant: '🤖',
            error: '❌'
          }[json.type] || '📦';
          
          // Build the complete output string
          let output = `\n   [${elapsed}s] ${icon} ${json.type?.toUpperCase() || 'UNKNOWN'}:\n`;
          
          // Format each property
          Object.entries(filtered).forEach(([key, value]) => {
            if (key === 'content' && Array.isArray(value)) {
              // Handle content array with text/thinking objects
              output += `     ${key}:\n`;
              value.forEach((item, idx) => {
                if (item.type === 'text' && item.text) {
                  output += `       [${idx}] text:\n`;
                  // Display with proper line breaks
                  item.text.split('\n').forEach(line => {
                    output += `         ${line}\n`;
                  });
                } else if (item.type === 'thinking' && item.thinking) {
                  output += `       [${idx}] thinking:\n`;
                  // Display thinking with proper line breaks
                  item.thinking.split('\n').forEach(line => {
                    output += `         ${line}\n`;
                  });
                }
              });
            } else if ((key === 'content' || key === 'result') && typeof value === 'string') {
              // Display string content/result with proper line breaks
              output += `     ${key}:\n`;
              value.split('\n').forEach(line => {
                output += `       ${line}\n`;
              });
            } else {
              // Other properties displayed normally
              output += `     ${key}: ${JSON.stringify(value)}\n`;
            }
          });
          
          // Single console.log for the entire event
          console.log(output.trimEnd());
          
          // Collect messages for final output
          if (json.content) {
            if (Array.isArray(json.content)) {
              // Extract text from content array
              json.content.forEach(item => {
                if (item.type === 'text' && item.text) {
                  messages.push(item.text);
                }
              });
            } else if (typeof json.content === 'string') {
              messages.push(json.content);
            }
          } else if (json.result) {
            finalResult = json;
          }
          
          fullOutput += line + '\n';
        } catch (e) {
          // Not JSON - plain text
          console.log(`   📄 ${line}`);
          fullOutput += line + '\n';
        }
      });

      // Handle stderr
      claudeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`   ❌ ${data.toString().trim()}`);
      });

      // Handle close
      claudeProcess.on('close', (code) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n   ✓ Completed in ${duration}s (exit: ${code})\n`);
        
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
          stdout: output,
          stderr: errorOutput,
          exitCode: code || 0,
          success
        });
      });

      // Handle errors
      claudeProcess.on('error', (error) => {
        console.error(`   ❌ Process error: ${error.message}`);
        reject(error);
      });

      // Close stdin to prevent hanging
      claudeProcess.stdin.end();

      // Optional timeout
      if (options.timeout) {
        setTimeout(() => {
          if (claudeProcess.exitCode === null) {
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
  async executeCommandStreaming(prompt) {
    return new Promise((resolve, reject) => {
      const cmdArray = ['claude', '-p', prompt, '--output-format', 'json'];
      console.log(`   📝 Running (streaming): ${cmdArray.join(' ')}`);
      console.log(`   📂 Working directory: ${this.projectDir}`);

      const { spawn } = require('child_process');
      
      // Use shell: true which we confirmed works
      const command = `claude -p "${prompt}" --output-format json`;
      const claudeProcess = spawn(command, [], {
        cwd: this.projectDir,
        env: process.env,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let fullOutput = '';
      let fullError = '';

      claudeProcess.stdout.on('data', (data) => {
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

      claudeProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        fullError += chunk;
        console.error(`   ❌ Error: ${chunk}`);
      });

      claudeProcess.on('close', (code) => {
        console.log(`   ✓ Process completed with code: ${code}\n`);
        
        let success = false;
        let stdout = '';
        
        try {
          const result = JSON.parse(fullOutput);
          success = result.is_error === false;
          stdout = result.result || '';
        } catch (e) {
          console.error(`   ⚠️  Failed to parse JSON: ${e.message}`);
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

      claudeProcess.on('error', (error) => {
        console.error(`   ❌ Process error: ${error.message}`);
        reject(error);
      });

      // Safety timeout
      const timeout = setTimeout(() => {
        if (claudeProcess.exitCode === null) {
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
  parseStreamJSON(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const messages = [];
    
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
  async runQuestScenario(scenario) {
    const results = {
      scenario: scenario.name,
      steps: []
    };

    for (const step of scenario.steps) {
      const result = await this.executeCommand(step.command, step.args || '');
      
      results.steps.push({
        description: step.description,
        command: step.command,
        args: step.args,
        success: result.success,
        output: result.stdout
      });

      // Run assertions if provided
      if (step.assertions) {
        for (const assertion of step.assertions) {
          const passed = await this.runAssertion(assertion);
          results.steps[results.steps.length - 1].assertions = 
            results.steps[results.steps.length - 1].assertions || [];
          results.steps[results.steps.length - 1].assertions.push({
            type: assertion.type,
            passed,
            message: assertion.message
          });
        }
      }

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
  async runAssertion(assertion) {
    switch (assertion.type) {
      case 'fileExists':
        return fs.existsSync(path.join(this.projectDir, assertion.path));
      
      case 'fileContains':
        if (!fs.existsSync(path.join(this.projectDir, assertion.path))) {
          return false;
        }
        const content = fs.readFileSync(
          path.join(this.projectDir, assertion.path), 
          'utf8'
        );
        return content.includes(assertion.content);
      
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
        return tracker[assertion.status].includes(assertion.questFile);
      
      case 'outputContains':
        const lastResult = this.results[this.results.length - 1];
        return lastResult && lastResult.output && 
               lastResult.output.includes(assertion.content);
      
      default:
        throw new Error(`Unknown assertion type: ${assertion.type}`);
    }
  }

  /**
   * Get all results from this runner
   */
  getResults() {
    return this.results;
  }

}

module.exports = { ClaudeE2ERunner };