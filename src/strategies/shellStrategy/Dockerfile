FROM ubuntu:24.04

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
  sudo \
  && apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN groupadd -r -g 1010 engine && \
  useradd --no-log-init -r -u 1030 -g engine engine && \
  echo 'engine ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/engine && \
  echo 'Defaults:engine !requiretty' >> /etc/sudoers.d/engine && \
  chmod 0440 /etc/sudoers.d/engine && \
  mkdir -p /home/engine /home/engine/.ssh && chown -R engine:engine /home/engine && \
  git config --system --add safe.directory '*'

USER engine
WORKDIR /home/engine/app

RUN sudo apt-get update && sudo apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  && sudo apt-get clean && \
  sudo rm -rf /var/lib/apt/lists/* && \
  sudo ln -s /usr/bin/python3 /usr/bin/python && \
  curl https://sh.rustup.rs -sSf | sh -s -- -y && \
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && \
  sudo apt-get install -y nodejs && \
  sudo npm install -g npm@latest && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
  sudo apt-get update && \
  sudo apt-get install -y yarn && \
  curl -fsSL https://bun.sh/install | bash && \
  sudo chmod -R a+x /home/engine/.bun/bin && \
  sudo mv /home/engine/.bun /usr/local/share/bun && \
  sudo ln -s /usr/local/share/bun/bin/bun /usr/local/bin/bun && \
  sudo chmod a+x /usr/local/bin/bun

ENV PATH="/home/engine/.cargo/bin:/usr/local/share/bun/bin:${PATH}"
ENV SHELL=/bin/bash
ENV DEBIAN_FRONTEND=noninteractive

COPY --chown=engine:engine package.json bun.lockb ./
RUN mkdir -p /home/engine/app/node_modules && sudo chown -R engine:engine /home/engine/app/node_modules

RUN bun install

COPY --chown=engine:engine . .

EXPOSE 8080

CMD ["bun", "src/cli.ts"]
