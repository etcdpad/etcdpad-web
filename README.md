# etcdpad-web

a web UI for etcd.

## features

- get, put, del keys
- get prefix
- watch and auto update view
- editor with garmmer (plain, json ...)

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

## RoadMap

- [ ] Reflash
- [ ] rversion view
- [ ] ttl
