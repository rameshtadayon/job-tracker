#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f job_tracker.db ]; then
  echo "No job_tracker.db found, nothing to back up."
  exit 0
fi

mkdir -p backups
STAMP=$(date +%Y%m%dT%H%M%S)
cp job_tracker.db "backups/job_tracker_${STAMP}.db"
echo "Backed up job_tracker.db -> backups/job_tracker_${STAMP}.db"
