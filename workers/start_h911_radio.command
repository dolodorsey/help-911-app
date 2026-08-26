#!/bin/zsh
set -eu

radio_root="/Users/dorsey/Desktop/TERMINAL/h911-radio"
decoder="$radio_root/sdrtrunk/sdr-trunk-osx-aarch64-v0.6.1/bin/sdr-trunk"

export SDR_TRUNK_OPTS="-Duser.home=$radio_root"
exec "$decoder"
