# Engine Core

Engine Core demonstrates a pattern for enabling LLMs to undertake tasks of a given scope with a dynamic system prompt and a curated collection of tool functions. We call these chat strategies.

Chat strategies offer a means to dynamically alter the chat history, system prompts, and available tools on every run to create opportunities for smarter approaches.

This project includes a simple illustrative example called `demoStrategy`, which serves as a starting point for creating new strategies.

There is also `backendStrategy`, a slightly more comprehensive example that interacts with a local directory, where the LLM works on a running Fastify app, creating database migrations and API endpoints.

Additionally, we have extracted the LLM integrations (e.g., Anthropic or OpenAI) into adapters, which allow you to run the same app code and strategies while switching foundation models.

## Getting started

1. Ensure Docker is installed and running
2. Copy `.env.example` to `.env` and add at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
3. Run `bin/cli`
