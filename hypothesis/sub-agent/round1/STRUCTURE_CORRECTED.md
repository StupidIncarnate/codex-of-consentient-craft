# Test Structure Corrected

## Issue Identified
Originally placed orchestrator/worker commands in nested project folders, but Claude commands must live in `.claude/commands/` directories.

## Corrected Structure

Each test now has the proper Claude command structure:

```
sub-agent/
  test1/
    .claude/commands/
      orchestrator.md     # Spawns worker, reads ../CLAUDE.md
      worker.md          # Reports context from test directory
    CLAUDE.md            # Contains test1_directory marker
    
  test2/
    .claude/commands/
      orchestrator.md     # Tests nested hierarchy
      worker.md          # Works in ../subdir/
    CLAUDE.md            # test2_root marker
    subdir/
      CLAUDE.md          # test2_subdir marker
      
  test5/
    .claude/commands/
      orchestrator.md     # Tests working directory control
      worker.md          # Should work in ../work_dir/
    root_dir/
      CLAUDE.md          # test5_root marker  
    work_dir/
      CLAUDE.md          # test5_work marker
```

## Theory Being Tested

**When a sub-agent is instructed to work in a specific directory, it should automatically read the CLAUDE.md from that directory.**

## How Tests Work

1. **Orchestrator** (in `.claude/commands/`):
   - Reads CLAUDE.md from test directories 
   - Spawns worker via Task tool
   - Instructs worker which directory to work in
   - Records results in JSON

2. **Worker** (spawned via Task):
   - Should automatically inherit CLAUDE.md from working directory
   - Reports what context it actually sees
   - Allows comparison with expected behavior

## Key Test Points

- **Test 1**: Basic inheritance (worker in same dir as CLAUDE.md)
- **Test 2**: Nested hierarchy (subdir vs parent CLAUDE.md)  
- **Test 3**: No local CLAUDE.md (fallback behavior)
- **Test 5**: Working directory control (spawn location vs work location)

This structure properly tests Claude's automatic CLAUDE.md discovery for sub-agents!