upstream etcdpad_core {
    server ${ETCDPAD_API_HOST};
}
server {
    listen ${ETCDPAD_LISTEN};

    location /epad {
        proxy_http_version 1.1;
        proxy_set_header Connection $http_connection;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_socket_keepalive on;
        client_max_body_size 100m;
        proxy_pass  http://etcdpad_core;
        proxy_set_header Upgrade $http_upgrade;
    }
    location / {
        root   /www;
        index  index.html index.htm;
    }
}
