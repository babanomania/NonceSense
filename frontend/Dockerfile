# Stage 1: Build WASM with Rust
FROM rust:1.83 as wasm-builder

WORKDIR /app
RUN cargo install wasm-pack
COPY wasm ./wasm
WORKDIR /app/wasm
RUN wasm-pack build --target web --release

# Stage 2: Prepare static frontend
FROM alpine:latest as builder

RUN apk add --no-cache gettext
WORKDIR /src

COPY index.html pow.js ./
COPY --from=wasm-builder /app/wasm/pkg ./pkg

ARG BACKEND_URL=http://localhost:8000
ENV BACKEND_URL=${BACKEND_URL}

RUN export BACKEND_URL=$BACKEND_URL && \
    envsubst '${BACKEND_URL}' < pow.js > pow.final.js && \
    mv pow.final.js pow.js

# Stage 3: Serve with nginx
FROM nginx:alpine
COPY --from=builder /src /usr/share/nginx/html
EXPOSE 80
