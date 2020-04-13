FROM node:13.12.0-alpine3.11 as builder
COPY . /code
WORKDIR /code
RUN yarn \
    && NODE_ENV=production yarn build

FROM nginx:1.17.9-alpine
ENV ETCDPAD_LISTEN=80 ETCDPAD_API_HOST=127.0.0.1:8989
COPY --from=builder /code/dist /www
COPY ./deploy/www.tpl /tmp/www.tpl
COPY ./deploy/entrypoint.sh /entrypoint.sh
RUN apk add --update --no-cache bash

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]
