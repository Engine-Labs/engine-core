#!/bin/sh

bun run migrate

cd project
bun install
bun nodemon

cd ../
bun run start
