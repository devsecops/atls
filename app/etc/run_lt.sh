#!/bin/bash
result=1
while [ $result -ne 0 ]; do
    echo Running localtunnel
    /opt/atls/node_modules/localtunnel/bin/client --port ${LT_PORT} --subdomain ${LT_SUBDOMAIN}
    result=$?
done
