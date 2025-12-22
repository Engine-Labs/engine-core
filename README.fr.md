[![enginelabs](https://github.com/user-attachments/assets/ed537409-ab60-4473-9a5b-a8511f3b6d2b)](https://enginelabs.ai)

[![](https://img.shields.io/discord/1113845829741056101?logo=discord&style=flat)](https://discord.gg/QnytC3Y7Wx)
[![](https://img.shields.io/twitter/follow/enginelabsai)](https://x.com/enginelabsai)

Engine est un ingénieur logiciel open source.

Il est agnostique aux modèles et extensible, basé sur des "stratégies" et des "adaptateurs".

Les stratégies de chat offrent un moyen de modifier dynamiquement le contexte, les prompts système et les outils disponibles à chaque exécution pour optimiser une tâche d'ingénierie particulière ou un environnement.

Ce projet inclut 3 exemples de stratégies :

1. `demoStrategy` - un exemple illustratif simple qui sert de point de départ pour créer de nouvelles stratégies
2. `backendStrategy` - un exemple légèrement plus complet où le LLM travaille sur une application Fastify locale (exécutée sur http://localhost:8080) pour créer des migrations de base de données et des endpoints API
3. `shellStrategy` - un shell alimenté par LLM qui peut écrire des fichiers et exécuter des processus

Les adaptateurs rendent tout LLM fondamental (GPT, Claude) interchangeable à chaud.

## Pour commencer

1. Assurez-vous que Docker est installé et en cours d'exécution
2. Copiez `.env.example` vers `.env` et ajoutez au moins l'une des clés `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`
3. Exécutez `bin/cli`
4. Sélectionnez un modèle LLM pour lequel vous avez fourni une clé API
5. Tapez `help` pour voir ce que vous pouvez faire

## Contribution

Les pull requests sont les bienvenues. Pour les changements majeurs, veuillez d'abord ouvrir une issue pour discuter de ce que vous aimeriez changer.

## Licence

[Apache 2.0](LICENSE)