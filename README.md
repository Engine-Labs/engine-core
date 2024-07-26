# Engine Core

Engine Core demonstrates a pattern for enabling LLMs to undertake tasks of a given scope with a dynamic system prompt and a curated collection of tool functions. We call these chat strategies.

Chat strategies offer a means to dynamically alter the chat history, system prompts, and available tools on every run to create opportunities for smarter approaches.

This project includes a simple illustrative example called `demoStrategy`, which serves as a starting point for creating new strategies.

There is also `backendStrategy`, a slightly more comprehensive example where the LLM works on a local Fastify app (running on http://localhost:8080) to create database migrations and API endpoints.

Additionally, we have extracted the LLM integrations (e.g., Anthropic or OpenAI) into adapters, which allow you to run the same app code and strategies while switching foundation models.

## Getting started

1. Ensure Docker is installed and running
2. Copy `.env.example` to `.env` and add at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
3. Run `bin/cli`
4. Type `help` to see what you can do

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[Apache 2.0](LICENSE)
