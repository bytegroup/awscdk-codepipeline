import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {APP} from "../constants/Constants";
import {DnsValidatedCertificate} from "aws-cdk-lib/aws-certificatemanager";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution, ViewerProtocolPolicy} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";

interface Props extends StackProps{
    webConfig: {
        baseDomainName: string;
        hostedZoneId: string;
        domainName: string;
        appEnv: string;
        host_bucket: string;
    },
}

export class S3DeployStack extends Stack{
    public readonly bucketDeployment:BucketDeployment;
    public readonly buildBucket:Bucket;
    public readonly distribution:Distribution;
    public readonly buildBucketArn: string;
    public readonly distributionId: string;

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

        this.buildBucket = new Bucket(this, APP+"-BuildBucket",{
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            bucketName: props.webConfig.host_bucket,
        });
        this.buildBucketArn = this.exportValue(this.buildBucket.bucketArn, {name:APP+'-web-bkt-'+props.webConfig.appEnv});
        //this.buildBucketArn = this.buildBucket.bucketArn;
        // Output the key
        //new CfnOutput(this, APP+'-bkt-cfnOut'+props.webConfig.appEnv, { value:  this.buildBucketArn});

        this.distribution = new Distribution(this, APP+"-Distribution", {
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

        this.distributionId = this.exportValue(this.distribution.distributionId, {name:APP+'-web-dist-'+props.webConfig.appEnv});
        //this.distributionId = this.distribution.distributionId;
        //new CfnOutput(this, APP+'-dist-cfnOutput'+props.webConfig.appEnv, { value:  this.distributionId});

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