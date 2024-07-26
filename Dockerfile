FROM oven/bun:latest

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  sqlite3 \
  tree \
  curl \
  && apt-get clean && \
  rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install --ci

COPY . .

RUN curl -fsSL -o /usr/local/bin/geni https://github.com/emilpriver/geni/releases/latest/download/geni-linux-amd64 && \
  chmod +x /usr/local/bin/geni

EXPOSE 8080

CMD ["bun", "src/cli.ts"]
