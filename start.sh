#!/bin/sh

EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

node subscribe.js $1 $EC2_IP $EC2_REGION

shift
/usr/local/bin/docker-entrypoint.sh $@



