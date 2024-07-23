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

COPY geni /usr/local/bin/geni
RUN chmod +x /usr/local/bin/geni

EXPOSE 8080

ENTRYPOINT ["bin/entrypoint.sh"]
