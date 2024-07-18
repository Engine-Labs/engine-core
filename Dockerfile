FROM oven/bun:canary

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  sqlite3 \
  tmux \
  tree \
  && apt-get clean && \
  rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install --ci

COPY . .

EXPOSE 8080

ENTRYPOINT ["bin/entrypoint.sh"]
