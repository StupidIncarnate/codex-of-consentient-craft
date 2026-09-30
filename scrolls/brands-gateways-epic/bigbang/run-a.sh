#!/usr/bin/env bash
# Segment A of the big-bang run (W1 -> SD12 -> W3 -> W4 -> W2). run-all.sh is the driver; this forwards to it.
#   bash run-a.sh [run-all.sh flags]   ==   bash run-all.sh [run-all.sh flags] A
exec bash "$(dirname "${BASH_SOURCE[0]}")/run-all.sh" "$@" A
