# Engine Core

project folder has bare bones fastify app
project folder is on docker volume for persistence
cli app runs in docker
expose one port for the fastify app

## Getting started

1. Ensure Docker is installed and running
2. Copy `.env.example` to `.env` and add at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
3. Run `bin/cli`
