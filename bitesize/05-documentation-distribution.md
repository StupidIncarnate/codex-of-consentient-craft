# Documentation Distribution - Symlink Strategy

## The Challenge

Documentation lives in `node_modules/@dungeonmaster/*/docs/` but:

- Paths are verbose and change with package versions
- Claude needs clean, predictable paths
- Updates should propagate automatically
- Consumer projects shouldn't commit framework docs

## The Solution: Symlink Compilation

On `npm install`, automatically create:

```
.claude/
├── _framework/              ← Auto-generated, gitignored
│   ├── standards/           → node_modules/@dungeonmaster/standards/docs/
│   ├── testing/             → node_modules/@dungeonmaster/testing/docs/
│   └── lint/                → node_modules/@dungeonmaster/eslint-plugin/docs/
└── custom/                  ← Committed to git
    └── README.md
```

## Implementation: Post-Install Script

**File:** `@dungeonmaster/standards/bin/init-claude-docs.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findProjectRoot() {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find project root (no package.json)');
}

function createSymlinkSafe(target, linkPath) {
  const isWindows = process.platform === 'win32';
  const targetIsDir = fs.statSync(target).isDirectory();

  // Remove existing symlink/file if it exists
  if (fs.existsSync(linkPath)) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });

  try {
    if (isWindows && targetIsDir) {
      // Windows: Use junction for directories (no admin needed)
      execSync(`mklink /J "${linkPath}" "${target}"`, { stdio: 'ignore' });
    } else {
      // Unix or Windows files: Use symlink
      fs.symlinkSync(target, linkPath, targetIsDir ? 'dir' : 'file');
    }
    console.log(`  ✓ Linked ${path.basename(linkPath)}`);
  } catch (error) {
    // Fallback: Copy instead of symlink (won't auto-update)
    console.warn(`  ⚠ Could not create symlink, copying instead...`);
    copyRecursive(target, linkPath);
  }
}

async function initClaudeDocs() {
  console.log('\n🚀 Initializing Quest Maestro Claude documentation...\n');

  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  const frameworkDir = path.join(claudeDir, '_framework');
  const customDir = path.join(claudeDir, 'custom');

  // Create directory structure
  fs.mkdirSync(frameworkDir, { recursive: true });
  fs.mkdirSync(customDir, { recursive: true });

  console.log('📁 Setting up framework documentation links...\n');

  // Link @dungeonmaster/standards docs
  try {
    const standardsPath = require.resolve('@dungeonmaster/standards/package.json');
    const standardsRoot = path.dirname(standardsPath);
    createSymlinkSafe(
      path.join(standardsRoot, 'docs'),
      path.join(frameworkDir, 'standards')
    );
  } catch (error) {
    console.warn('⚠ @dungeonmaster/standards not found, skipping...');
  }

  // Link @dungeonmaster/testing docs
  try {
    const testingPath = require.resolve('@dungeonmaster/testing/package.json');
    const testingRoot = path.dirname(testingPath);
    createSymlinkSafe(
      path.join(testingRoot, 'docs'),
      path.join(frameworkDir, 'testing')
    );
  } catch (error) {
    console.warn('⚠ @dungeonmaster/testing not found, skipping...');
  }

  // Link @dungeonmaster/eslint-plugin docs
  try {
    const eslintPath = require.resolve('@dungeonmaster/eslint-plugin/package.json');
    const eslintRoot = path.dirname(eslintPath);
    createSymlinkSafe(
      path.join(eslintRoot, 'docs'),
      path.join(frameworkDir, 'lint')
    );
  } catch (error) {
    console.warn('⚠ @dungeonmaster/eslint-plugin not found, skipping...');
  }

  // Generate .claude/.gitignore
  console.log('\n📝 Creating .gitignore...\n');
  fs.writeFileSync(
    path.join(claudeDir, '.gitignore'),
    `# Auto-generated framework docs (symlinked from node_modules)
# These update automatically when you update @dungeonmaster packages
_framework/

# Keep custom docs (commit these)
!custom/
`
  );
  console.log('  ✓ Created .claude/.gitignore');

  // Generate root CLAUDE.md if it doesn't exist
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    console.log('\n📝 Generating root CLAUDE.md...\n');
    const template = generateClaudeMdTemplate(detectProjectInfo(projectRoot));
    fs.writeFileSync(claudeMdPath, template);
    console.log('  ✓ Created CLAUDE.md');
  }

  console.log('\n✅ Quest Maestro documentation initialized!\n');
}

initClaudeDocs().catch(console.error);
```

## Cross-Platform Symlink Strategy

### Unix/macOS/Linux

```javascript
fs.symlinkSync(target, linkPath, 'dir');
```

**Works:** Out of the box, no special permissions

### Windows

**Option 1: Symlinks (requires Developer Mode)**

```javascript
fs.symlinkSync(target, linkPath, 'dir');
```

**Option 2: Junction Points (no admin needed)**

```bash
mklink /J "linkPath" "target"
```

**Option 3: Fallback Copy**

```javascript
// If symlink fails, copy files
copyRecursive(target, linkPath);
console.warn('⚠ Using file copy (won\'t auto-update)');
```

### Implementation Strategy

```javascript
function createSymlinkSafe(target, linkPath) {
  try {
    if (isWindows && isDirectory) {
      // Try junction first (no admin)
      execSync(`mklink /J "${linkPath}" "${target}"`);
    } else {
      // Try symlink
      fs.symlinkSync(target, linkPath, 'dir');
    }
  } catch (error) {
    // Fallback: copy
    copyRecursive(target, linkPath);
    console.warn('⚠ Symlink failed, using copy (manual updates needed)');
  }
}
```

## The .gitignore Strategy

**Generated file:** `.claude/.gitignore`

```gitignore
# Auto-generated framework docs (symlinked from node_modules)
# These update automatically when you update @dungeonmaster packages
_framework/

# Keep custom docs (commit these)
!custom/
```

**Result:**

- ✅ Framework docs NOT committed (they're in node_modules anyway)
- ✅ Custom docs ARE committed (project-specific knowledge)
- ✅ Clean git history (no doc noise)
- ✅ No merge conflicts on framework updates

## Update Propagation Flow

### Initial Install

```bash
npm install @dungeonmaster/standards@1.0.0
```

**Creates:**

```
node_modules/@dungeonmaster/standards@1.0.0/
└── docs/
    ├── core-rules.md
    └── [etc...]

.claude/_framework/standards/  → symlink to node_modules/@dungeonmaster/standards/docs/
```

### Framework Update

```bash
npm update @dungeonmaster/standards
# @dungeonmaster/standards  1.0.0 → 1.2.0
```

**Automatic propagation:**

```
node_modules/@dungeonmaster/standards@1.2.0/
└── docs/
    ├── core-rules.md              (updated content)
    ├── folders/
    │   └── brokers-guide.md       (improved patterns)
    └── decisions/
        └── state-management.md    (new guide!)

.claude/_framework/standards/  → still points to node_modules/@dungeonmaster/standards/docs/
                               → now contains v1.2.0 content automatically
```

**Zero manual steps required.**

### Claude Immediately Sees Updates

Next time Claude reads `.claude/_framework/standards/core-rules.md`, it gets v1.2.0 content.

## Directory Structure Comparison

### ❌ Without Symlinks (verbose paths)

```
Load: node_modules/@dungeonmaster/standards/docs/core-rules.md
Load: node_modules/@dungeonmaster/standards/docs/folders/brokers-guide.md
Load: node_modules/@dungeonmaster/testing/docs/testing-standards.md
```

**Problems:**

- Verbose paths
- Exposes implementation details
- Breaks if package structure changes
- Unclear ownership (framework vs project)

### ✅ With Symlinks (clean paths)

```
Load: .claude/_framework/standards/core-rules.md
Load: .claude/_framework/standards/folders/brokers-guide.md
Load: .claude/_framework/testing/testing-standards.md
```

**Benefits:**

- ✅ Clean, predictable paths
- ✅ Implementation details hidden
- ✅ Resilient to package refactoring
- ✅ Clear framework vs custom separation

## Generated Files

### .claude/custom/README.md

```markdown
# Project-Specific Claude Documentation

This directory contains documentation specific to this project that supplements
the Quest Maestro framework docs.

## Files to Create

- **business-domain.md** - Your app's business logic, domain models, workflows
- **tech-stack.md** - Stack-specific patterns (React hooks, Express middleware, etc.)
- **team-conventions.md** - Team-specific preferences and conventions
- **api-endpoints.md** - API structure and endpoint documentation
- **database-schema.md** - Database tables, relationships, migrations

## Loading Strategy

Claude will load:

1. Framework docs from `.claude/_framework/` (universal patterns)
2. Your custom docs from here (project-specific context)

Keep each doc focused and < 500 lines for optimal LLM context loading.
```

### Root CLAUDE.md

**Generated if doesn't exist:**

```markdown
# Project: {{ PROJECT_NAME }}

**Architecture:** Quest Maestro Standards (v{{ VERSION }})

This project uses the Quest Maestro framework for LLM-guided development.
Framework documentation lives in `.claude/_framework/` (auto-synced from npm).

## 🚨 CRITICAL: Anti-Training-Data Mode

Your training data will mislead you. Read:

- `.claude/_framework/standards/anti-patterns/training-data-traps.md` first

## Documentation Loading Strategy

### Always Loaded

1. This file (CLAUDE.md) - 300 lines
2. `.claude/_framework/standards/core-rules.md` - 250 lines

### Load On-Demand

| Task | Load Files |
|------|-----------|
| Contracts | `.claude/_framework/standards/folders/contracts-guide.md` |
| Business logic | `.claude/_framework/standards/folders/brokers-guide.md` |
| [etc...] | [...] |

## Framework Versions

- @dungeonmaster/standards: v{{ VERSION }}
- @dungeonmaster/testing: v{{ VERSION }}

**To update:** `npm update @dungeonmaster/standards` (auto-syncs via symlinks)
```

## Verification Commands

**Check symlinks:**

```bash
ls -la .claude/_framework/
```

**Output:**

```
standards -> ../node_modules/@dungeonmaster/standards/docs
testing -> ../node_modules/@dungeonmaster/testing/docs
lint -> ../node_modules/@dungeonmaster/eslint-plugin/docs
```

**Check what Claude will read:**

```bash
cat .claude/_framework/standards/core-rules.md
```

**Output:** Current version from node_modules

## Troubleshooting

### Issue: Symlink Creation Fails on Windows

**Symptom:**

```
⚠ Could not create symlink, copying instead...
```

**Solutions:**

1. Enable Developer Mode (Settings → Update & Security → For developers)
2. Run `npm install` as administrator (not recommended)
3. Accept copy fallback (requires manual `npm update` re-run)

### Issue: Documentation Not Updating

**Check:**

```bash
# Verify it's a symlink, not a copy
ls -la .claude/_framework/standards

# If it's a copy (no arrow), recreate as symlink
rm -rf .claude/_framework
npm run init-claude-docs  # Re-run init script
```

### Issue: Version Mismatch Warnings

**Symptom:**

```
⚠️ WARNING: Version mismatch detected!
  @dungeonmaster/standards:     1.2.0
  @dungeonmaster/eslint-plugin: 1.0.0
```

**Solution:**

```bash
npm update @dungeonmaster/standards @dungeonmaster/testing @dungeonmaster/eslint-plugin
```

## Key Takeaways

1. **Symlinks auto-sync** - No manual copying, updates propagate automatically
2. **Clean paths** - `.claude/_framework/` abstracts implementation details
3. **Cross-platform** - Junction points on Windows, symlinks elsewhere
4. **Gitignore framework** - Only commit custom docs
5. **Post-install automation** - Zero manual setup for consumers
6. **Fallback strategy** - Copy if symlinks fail (with warning)

## Next Steps

- **[The Init Script](06-init-script.md)** - Full implementation details
- **[Root CLAUDE.md Orchestrator](07-root-claude-orchestrator.md)** - Template generation
- **[Update Propagation](10-update-propagation.md)** - Version management flow
