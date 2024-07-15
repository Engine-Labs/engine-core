#!/bin/sh

cd "$(dirname "$0")"
cd ../

cd project
bun install
bun run build
bun run migrate

cd ../

bun run project:start &
bun run start
