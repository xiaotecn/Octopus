FROM node:22-bookworm-slim AS web-builder

ARG APP_VERSION=dev
ARG GITHUB_REPO=https://github.com/xiaotecn/Octopus

WORKDIR /src/web

RUN corepack enable

COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN NEXT_PUBLIC_APP_VERSION="${APP_VERSION}" NEXT_PUBLIC_GITHUB_REPO="${GITHUB_REPO}" pnpm build

FROM golang:1.25.0-bookworm AS go-builder

ARG APP_VERSION=dev
ARG GITHUB_REPO=https://github.com/xiaotecn/Octopus
ARG BUILD_TIME=unknown
ARG GIT_COMMIT=unknown
ARG APP_AUTHOR=xiaotecn

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
COPY --from=web-builder /src/web/out ./static/out

RUN CGO_ENABLED=0 go build -trimpath -ldflags="-X 'github.com/bestruirui/octopus/internal/conf.Version=${APP_VERSION}' -X 'github.com/bestruirui/octopus/internal/conf.BuildTime=${BUILD_TIME}' -X 'github.com/bestruirui/octopus/internal/conf.Author=${APP_AUTHOR}' -X 'github.com/bestruirui/octopus/internal/conf.Commit=${GIT_COMMIT}' -X 'github.com/bestruirui/octopus/internal/conf.Repo=${GITHUB_REPO}' -s -w" -o /out/octopus ./main.go

FROM debian:bookworm-slim

ENV TZ=Asia/Shanghai
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    rm -rf /var/lib/apt/lists/*

COPY --from=go-builder /out/octopus /app/octopus

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["/app/octopus", "start"]
