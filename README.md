[![enginelabs](https://github.com/user-attachments/assets/ed537409-ab60-4473-9a5b-a8511f3b6d2b)](https://enginelabs.ai)

[![](https://img.shields.io/discord/1113845829741056101?logo=discord&style=flat)](https://discord.gg/QnytC3Y7Wx)
[![](https://img.shields.io/twitter/follow/enginelabsai)](https://x.com/enginelabsai)

Engine is an open source software engineer. 

It is model agnostic and extensible, based on 'strategies' and 'adapters'.

Chat strategies offer a means to dynamically alter context, system prompts, and available tools on every run to optimise for a particular engineering task or environment.

This project includes 3 example strategies:

1.  `demoStrategy` - a simple illustrative example called which serves as a starting point for creating new strategies
2.  `backendStrategy` - a slightly more comprehensive example where the LLM works on a local Fastify app (running on http://localhost:8080) to create database migrations and API endpoints
3.  `shellStrategy` - a LLM powered shell that can write files and run processes

Adapters make any foundational LLM (GPT, Claude) hot swappable.

## Getting started

1. Ensure Docker is installed and running
2. Copy `.env.example` to `.env` and add at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
3. Run `bin/cli`
4. Select a LLM model for which you have provided an API key
5. Type `help` to see what you can do

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[Apache 2.0](LICENSE)
