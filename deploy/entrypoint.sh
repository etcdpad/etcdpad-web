#!/bin/bash

set -eu
envsubst "\$ETCDPAD_LISTEN \$ETCDPAD_API_HOST" < /tmp/www.tpl > /etc/nginx/conf.d/default.conf
exec "$@"
