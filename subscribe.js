// #!/bin/sh
//
// ROUTES=$(aws --output text route53 list-hosted-zones)
// ZONE=$(echo $ROUTES | grep -Eo "\w+ glasshouse.local." | grep -o -e '^[^ ]*')
//
// INSTANCE_DNS=$(wget -q -O - http://instance-data/latest/meta-data/local-hostname)
//
// sed -i "s/INSTANCE_DNS/$INSTANCE_DNS/g" placeholder.json
// aws route53 change-resource-record-sets --hosted-zone-id $ZONE --change-batch file://placeholder.json
//
// # -bind=<external ip> -retry-join=<root agent ip> -bootstrap-expect=<number of server agents>
// /usr/local/bin/docker-entrypoint.sh consul agent -server -dev -client 0.0.0.0 -bind 0.0.0.0 -advertise $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)

const AWS = require('aws-sdk');
AWS.config.update({ region: process.argv[4] });

const route53 = new AWS.Route53();

const zoneRegex = /\.(.*)/;
const recordRegex = /([^.]*)/;
const instanceDNS = process.argv[3];

function getHostedZone(zoneName){
    return new Promise((resolve, reject) => {
        route53.listHostedZonesByName({ DNSName: zoneName}, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

function getRecordSets(zoneId, recordSetName){
    return new Promise((resolve, reject) => {
        route53.listResourceRecordSets({ HostedZoneId: zoneId, StartRecordName: recordSetName}, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    });
}

function updateRecordSet(hostedZoneId,recordSet){
    return new Promise((resolve, reject) => {
        recordSet.ResourceRecords.push({Value: instanceDNS})
        const params = {
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: recordSet.Name,
                            Type: 'A',
                            TTL: 5,
                            ResourceRecords: recordSet.ResourceRecords,
                        }
                    }
                ]
            }
        }
        console.log(params.ChangeBatch.Changes[0].ResourceRecordSet);
        route53.changeResourceRecordSets(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    });
}
if (zoneRegex.test(process.argv[2]) && recordRegex.test(process.argv[2])){
    const hostedZoneName = zoneRegex.exec(process.argv[2])[1];
    const recordSet = recordRegex.exec(process.argv[2])[1];
    getHostedZone().then((hostedZones) => {
        const hostedZoneId = hostedZones.HostedZones[0].Id;
        getRecordSets(hostedZoneId, `${recordSet}.${hostedZoneName}`).then((recordSets) => {
            updateRecordSet(hostedZoneId, recordSets.ResourceRecordSets[0]).then((data) => {
                console.log('Updated!');
            }).catch(console.error);
        }).catch(console.error);
    }).catch(console.error);

} else console.error(process.argv[2], 'is a invalid DNS record');
