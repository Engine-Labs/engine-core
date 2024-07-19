#!/bin/sh

cd "$(dirname "$0")"
cd ../

# cd project
# bun install >/dev/null 2>&1
# bun run build >/dev/null 2>&1
# bun run migrate >/dev/null 2>&1

# cd ../

# bun run project:start >/dev/null 2>&1 &
bun run start
