# syntax=docker/dockerfile:1.4
FROM --platform=$BUILDPLATFORM cgr.dev/chainguard/go:latest as build
LABEL maintainer="Will Norris <will@willnorris.com>"

WORKDIR /app
RUN git clone https://github.com/willnorris/imageproxy.git /app
RUN go mod download

ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -v ./cmd/imageproxy

FROM alpine:latest

COPY --from=build /app/imageproxy /app/imageproxy

CMD ["-addr", "0.0.0.0:8080"]
ENTRYPOINT ["/app/imageproxy"]

EXPOSE 8080
