# syntax=docker.io/docker/dockerfile:1
FROM docker.io/denoland/deno:distroless-2.1.3

WORKDIR /app
COPY ./src/ /app/src/
COPY deno.json deno.lock /app

# Reproducible build 非対応のため deno install を実行しない
#RUN ["deno", "install"]

CMD ["task", "start"]
