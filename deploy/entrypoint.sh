#!/bin/bash

set -eu
envsubst < /tmp/www.tpl > /etc/nginx/conf.d/default.conf
exec "$@"
