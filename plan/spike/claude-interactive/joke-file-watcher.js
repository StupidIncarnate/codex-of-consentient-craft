#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎭 Joke File Watcher\n');

// Create spike-tmp directory in project root
const spikeTmpDir = path.join(process.cwd(), 'spike-tmp');

// Clean up and recreate spike-tmp directory
if (fs.existsSync(spikeTmpDir)) {
  fs.rmSync(spikeTmpDir, { recursive: true, force: true });
}
fs.mkdirSync(spikeTmpDir);
console.log(`Created clean spike-tmp directory at: ${spikeTmpDir}\n`);

// Read the joke file agent role
const agentPath = path.join(__dirname, 'joke-file-agent.md');
const agentRole = fs.readFileSync(agentPath, 'utf8');

const claudePath = path.join(process.cwd(), 'node_modules', '.bin', 'claude');
const signalFile = path.join(spikeTmpDir, 'joke-complete.txt');

console.log(`Monitoring for: ${signalFile}`);
console.log('\nStarting Claude...');
console.log('Try: "tell me a joke"\n');

// Start Claude
const claudeProcess = spawn(claudePath, [agentRole], {
  stdio: 'inherit',
  env: process.env
});

// Monitor for signal file
let checkInterval = setInterval(() => {
  if (fs.existsSync(signalFile)) {
    clearInterval(checkInterval);
    
    console.log('\n\n🎯 JOKE COMPLETE SIGNAL DETECTED!');
    console.log('🔪 Killing Claude...');
    
    claudeProcess.kill();
    
    setTimeout(() => {
      fs.unlinkSync(signalFile);
      console.log('✅ Joke Received');
      
      // Spawn the review agent
      console.log('\n' + '─'.repeat(50));
      console.log('🚀 Spawning Review Agent...\n');
      
      const reviewAgentPath = path.join(__dirname, 'review-agent.md');
      const reviewRole = fs.readFileSync(reviewAgentPath, 'utf8');
      const reviewSignalFile = path.join(spikeTmpDir, 'review-complete.txt');
      
      // Spawn review agent
      const reviewProcess = spawn(claudePath, [reviewRole], {
        stdio: 'inherit',
        env: process.env
      });
      
      // Monitor for review completion
      let reviewCheckInterval = setInterval(() => {
        if (fs.existsSync(reviewSignalFile)) {
          clearInterval(reviewCheckInterval);
          
          console.log('\n\n🎯 REVIEW COMPLETE SIGNAL DETECTED!');
          console.log('🔪 Killing Review Agent...');
          
          reviewProcess.kill();
          
          setTimeout(() => {
            fs.unlinkSync(reviewSignalFile);
            console.log('✅ Review Completed');
            console.log('\n🏁 All agents completed successfully!');
            process.exit(0);
          }, 500);
        }
      }, 200);
      
      // Handle review agent exit
      reviewProcess.on('exit', (code) => {
        clearInterval(reviewCheckInterval);
        if (!fs.existsSync(reviewSignalFile)) {
          console.log(`\nReview agent exited with code ${code} (no review signal detected)`);
          process.exit(code);
        }
      });
    }, 500);
  }
}, 200); // Check every 200ms

// Handle Claude exit
claudeProcess.on('exit', (code) => {
  clearInterval(checkInterval);
  if (!fs.existsSync(signalFile)) {
    console.log(`\nClaude exited with code ${code} (no joke detected)`);
  }
});