#!/bin/sh

EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

node subscribe.js $1 $EC2_IP $EC2_REGION

# -bind=<external ip> -retry-join=<root agent ip> -bootstrap-expect=<number of server agents>
echo "${@:2}"
/usr/local/bin/docker-entrypoint.sh ${@:2}



#docker run consul-test consul-server.glasshouse.local agent -server -dev  -ui -bind 0.0.0.0  -client 0.0.0.0  -retry-join consul-server.glasshouse.local.  -advertise $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4) -recursor=10.0.0.2
