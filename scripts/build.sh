#! /usr/bin/env bash

set -e
set -o pipefail
set -u

export SOURCE_DIR="${SOURCE_DIR:-$PWD}"

# shellcheck source=scripts/env.sh
source "$SOURCE_DIR/scripts/env.sh"

rm -rf "$BUILD_OUTPUT_DIR"

tsc \
    --outDir "$BUILD_OUTPUT_DIR" \
    --project "$SOURCE_DIR/src/lib"
