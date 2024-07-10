#!/bin/sh

cd "$(dirname "$0")"
cd ../

cd project
bun install
bun run build
bun run migrate

cd ../

bin/overmind start -D -N -c project

timeout=30
elapsed=0
interval=1

while [ ! -e .overmind.sock ]; do
  if [ "$elapsed" -ge "$timeout" ]; then
    echo "Timed out waiting for Overmind to create .overmind.sock"
    exit 1
  fi
  echo "Waiting for Overmind to start..."
  sleep "$interval"
  elapsed=$((elapsed + interval))
done

bin/overmind echo
