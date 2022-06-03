import {Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {APP, HOST_BUCKET} from "../constants/Constants";
import {DnsValidatedCertificate} from "aws-cdk-lib/aws-certificatemanager";
import {posix} from "path";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution, ViewerProtocolPolicy} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";

interface Props extends StackProps{
    webConfig: {
        baseDomainName: string,
        hostedZoneId: string,
        domainName: string,
        appEnv: string,
    },
}

export class S3DeployStack extends Stack{
    public readonly bucketDeployment:BucketDeployment;
    public readonly buildBucket:Bucket;
    public readonly distribution:Distribution;

    constructor(scope: Construct, id:string, props:Props) {
        super(scope, id, props);

        // Route53
        const zone = HostedZone.fromHostedZoneAttributes(this, APP+'host-zone', {
            hostedZoneId: props.webConfig.hostedZoneId,
            zoneName: props.webConfig.baseDomainName,
        });

        const certificate = new DnsValidatedCertificate(this, 'CrossRegionCertificate', {
            domainName: props.webConfig.domainName,
            hostedZone: zone,
            region: 'us-east-1',
        });

        this.buildBucket = new Bucket(this, "BuildBucket",{
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            bucketName: HOST_BUCKET,
        });

        this.distribution = new Distribution(this, "Distribution", {
            defaultBehavior: {
                origin: new S3Origin(this.buildBucket),
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            defaultRootObject: "index.html",
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                    ttl: Duration.minutes(5),
                },
            ],
            domainNames: [props.webConfig.domainName],
            certificate: certificate,
        });

        // Route 53 record
        new ARecord(this, 'Alias', {
            zone: zone,
            recordName: props.webConfig.domainName,
            target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
        });

        // deploy to bucket
        /*this.bucketDeployment = new BucketDeployment(this,APP+'-bucket',{
            sources: [Source.asset('../out')],
            destinationBucket: buildBucket,
            distribution: distribution,
        });*/
    }
}