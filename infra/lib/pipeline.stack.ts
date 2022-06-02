import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import {aws_cloudfront, aws_cloudfront_origins, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { aws_s3,aws_s3_deployment} from 'aws-cdk-lib';
import {DnsValidatedCertificate} from "aws-cdk-lib/aws-certificatemanager";
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
import {Construct} from "constructs";

interface Props extends StackProps{

}

export class PipelineStack extends Stack{
    constructor(scope:Construct, id:string, private readonly props: Props) {
        super(scope, id, props);
        if (!props) {
            throw new Error('props required');
        }

        const domainName = 'map-app.staging.mine.toggle-pf.com';

        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'mine-map-staging-hosted-zone', {
            hostedZoneId: 'Z0027987VXSPGRROHS3A',
            zoneName: 'staging.mine.toggle-pf.com',
        });

        const certificate = new DnsValidatedCertificate(this, 'CrossRegionCertificate', {
            domainName,
            hostedZone: hostedZone,
            region: 'us-east-1',
        });

        const buildBucket = new aws_s3.Bucket(this, "BuildBucket",{
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            bucketName: 'minemap-client-host',
        });

        const distribution = new aws_cloudfront.Distribution(this, "Distribution", {
            defaultBehavior: {
                origin: new aws_cloudfront_origins.S3Origin(buildBucket),
                viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
            domainNames: [domainName],
            certificate: certificate,
        });

        const route53Rec = new route53.ARecord(this, 'Alias', {
            zone: hostedZone,
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
        });

        const pipelineName = 'minemap-client-pipeline';
        const pipeline = new CodePipeline(this, pipelineName+'-stack', {
            pipelineName,
            crossAccountKeys: false,
            synth: new ShellStep("Synth", {
                input: CodePipelineSource.gitHub('toggle-inc/mine_map_app_client', 'staging', {
                    authentication: cdk.SecretValue.secretsManager('github-toggle-token'),
                }),
                commands: [
                    "mv .env.local.example .env",
                    "yarn install",
                    "cd infra && yarn install && cd ../",
                    "yarn lint",
                    // XXX: add unit command
                    "yarn build",
                    "ls",
                    "cd infra",
                    "npm ci",
                    "npm run build",
                    "npx cdk synth -v",
                ],
                primaryOutputDirectory: 'infra/cdk.out',
            }),
        });

        const deploy = new aws_s3_deployment.BucketDeployment(this,'mineMapAppClientDeploy',{
            sources: [aws_s3_deployment.Source.asset('../out')],
            destinationBucket: buildBucket,
            distribution: distribution
        });
    }
}