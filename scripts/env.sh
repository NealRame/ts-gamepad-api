#! /usr/bin/env bash

set -e
set -o pipefail
set -u

export PATH=$PATH:$PWD/node_modules/.bin
export BUILD_OUTPUT_DIR="${BUILD_OUTPUT_DIR:-./dist}"
