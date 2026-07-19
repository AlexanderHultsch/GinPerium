#!/bin/sh
set -e

# Das Docker-Volume gehört beim ersten Start root; hier auf den node-User
# umbiegen und Root-Rechte anschließend über su-exec abgeben.
mkdir -p /data
chown -R node:node /data

exec su-exec node "$@"
