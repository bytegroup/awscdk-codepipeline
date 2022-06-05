import {SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {APP, githubConfig, HOST_BUCKET, RESOURCE_BUCKET} from "../constants/Constants";
import {CodeBuildAction, GitHubSourceAction, GitHubTrigger, S3DeployAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {LinuxBuildImage, Project, Source} from "aws-cdk-lib/aws-codebuild";
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildCommands} from "../constants/build.commands";
import {Effect, ManagedPolicy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";

interface Props extends StackProps {
    buildBucket: Bucket,
    distribution: Distribution,
}

const artifacts = {
    source: new Artifact("Source"),
    build: new Artifact("Build"),
}

export class PipelineStack extends Stack{
    constructor(scope:Construct, id:string, private readonly props: Props) {
        super(scope, id, props);
        if (!props) {
            throw new Error('props required');
        }

        /*new GitHubSourceCredentials(this, APP+"-github-creds", {
            accessToken: SecretValue.secretsManager(githubConfig.secreteManagerTokenName),
        });*/

        const source = Source.gitHub({
            owner: githubConfig.owner,
            repo: githubConfig.repo,
            webhook: false,
            /*webhookFilters: [
                FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(githubConfig.branch),
            ],*/
        });

        const stack = Stack.of(this);
        const buildSpec = new BuildCommands().getBuildSpec();
        const project = new Project(this, APP+"-project", {
            projectName: APP+"-project",
            buildSpec,
            source,
            environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0,
                privileged: true,
            },
            environmentVariables: {
                RESOURCE_BUCKET: {
                    value: RESOURCE_BUCKET,
                },
                HOST_BUCKET: {
                    value: HOST_BUCKET,
                },
                DISTRIBUTION_ID: {
                    value: props.distribution.distributionId,
                },
            },
        });

        project.addToRolePolicy(
            new PolicyStatement({
                actions: ["secretsmanager:GetSecretValue"],
                resources: [githubConfig.secreteManagerTokenArn],
            })
        );
        project.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
        );
        project.addToRolePolicy(new PolicyStatement({
            actions: ["cloudfront:CreateInvalidation"],
            effect: Effect.ALLOW,
            resources:["*"]
        }));

        const pipelineActions = {
            source: new GitHubSourceAction({
                actionName: "Github",
                owner: githubConfig.owner,
                repo: githubConfig.repo,
                branch: githubConfig.branch,
                oauthToken: SecretValue.secretsManager(githubConfig.secreteManagerTokenName),
                output: artifacts.source,
                trigger: GitHubTrigger.WEBHOOK,
            }),

            build: new CodeBuildAction({
                actionName: APP+"-CodeBuild",
                project,
                input: artifacts.source,
                outputs: [artifacts.build],
            }),
            deploy: new S3DeployAction({
                actionName: APP+'-bucket-action',
                /*bucket: new BucketDeployment(this,APP+'-bucket',{
                    sources: [
                        s3_deployment.Source.asset('out'),
                        /!*s3_deployment.Source.bucket(
                            Bucket.fromBucketName(this, "host-bucket", artifacts.build.s3Location.bucketName),
                            artifacts.build.s3Location.objectKey),*!/
                    ],
                    destinationBucket: props.buildBucket,
                    distribution: props.distribution,
                }).deployedBucket,*/
                bucket: Bucket.fromBucketName(this, APP+'-host-bucket', HOST_BUCKET),
                input: artifacts.build,
                //extract: false,
                //cacheControl:[CacheControl.noCache()]
            }),
        }
        const pipeline = new Pipeline(this, APP+"-pipeline", {
            pipelineName: APP+"-pipeline",
            stages: [
                { stageName: "Source", actions: [pipelineActions.source] },
                { stageName: "Build", actions: [pipelineActions.build] },
                { stageName: "Deploy", actions: [pipelineActions.deploy] },
            ],
        });
    }
}