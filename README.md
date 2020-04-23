# etcdpad-web

a web UI for etcd.

## features

- [x] get, put, del keys
- [x] get prefix
- [x] watch and auto update view
- [x] editor with garmmer (plain, json ...)
- [x] watch/get all support
- [x] full key view and copy
- [x] reflash
- [ ] rversion view
- [ ] ttl

## Usage

### Docker Compose

``` yaml
version: "3"

services:
    api:
        image: etcdpad/api:latest
        command: ["-port", "8989", "-stdout", "true"]
    web:
        image: etcdpad/web:latest
        ports:
          - "12379:12379"
        depends_on:
          - api
        environment:
            ETCDPAD_LISTEN: 12379
            ETCDPAD_API_HOST: api:8989

```

