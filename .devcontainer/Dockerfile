# Base image with Node.js 22 (Linux, multi-arch)
FROM node:22-bookworm

# ---- Base tools ----
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    vim \
    less \
    postgresql-client \
    tree \
  && rm -rf /var/lib/apt/lists/*

# ---- Enable Corepack (pnpm) ----
RUN corepack enable \
  && corepack prepare pnpm@latest --activate

# ---- Developer-friendly aliases ----
RUN echo 'alias treenext="tree -I \"node_modules|.next|dist|.turbo|.git|coverage|*.log|*.tmp|*.pid\" -a --dirsfirst"' >> /root/.bashrc \
 && echo 'alias treesrc="tree src/ -I \"node_modules|.next|dist|.turbo\" --dirsfirst"' >> /root/.bashrc \
 && echo 'alias treecode="tree -I \"node_modules|.next|dist|.turbo|.git\" -a --dirsfirst"' >> /root/.bashrc

WORKDIR /workspace

CMD ["sleep", "infinity"]
