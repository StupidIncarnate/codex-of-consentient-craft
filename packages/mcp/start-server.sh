#!/bin/bash
cd /home/brutus-home/projects/codex-of-consentient-craft
export DUNGEONMASTER_HOME="${DUNGEONMASTER_HOME:-$(pwd)/.dungeonmaster}"
exec tsx packages/mcp/src/index.ts
