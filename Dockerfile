FROM ubuntu:noble

WORKDIR /usr/src/app

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
  software-properties-common \
  wget \
  curl \
  unzip \
  sqlite3 \
  tree \
  lsof \
  procps \
  pkg-config \
  libssl-dev \
  git \
  apt-utils \
  build-essential \
  python3 \
  python3-pip \
  python3-venv \
  && apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  ln -s /usr/bin/python3 /usr/bin/python && \
  curl https://sh.rustup.rs -sSf | sh -s -- -y && \
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get install -y nodejs && \
  npm install -g npm@latest && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y yarn && \
  curl -fsSL https://bun.sh/install | bash && \
  chmod -R a+x /root/.bun/bin && \
  mv /root/.bun /usr/local/share/bun && \
  ln -s /usr/local/share/bun/bin/bun /usr/local/bin/bun && \
  chmod a+x /usr/local/bin/bun

ENV PATH="/usr/local/go/bin:${PATH}"
ENV PATH="/root/.cargo/bin:${PATH}"
ENV PATH="/usr/local/share/bun/bin:${PATH}"
ENV SHELL=/bin/bash
ENV DEBIAN_FRONTEND=noninteractive

COPY package.json bun.lockb ./
RUN bun install

COPY . .

EXPOSE 8080

ENTRYPOINT ["bin/entrypoint.sh"]
