import {SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {APP, githubConfig, HOST_BUCKET} from "../constants/Constants";
import {
    CodeBuildAction, EcsDeployAction,
    GitHubSourceAction,
    GitHubTrigger, S3DeployAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
    LinuxBuildImage,
    Project,
    Source
} from "aws-cdk-lib/aws-codebuild";
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildCommands} from "../constants/build.commands";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {BucketDeployment} from "aws-cdk-lib/aws-s3-deployment";
import * as s3_deployment from "aws-cdk-lib/aws-s3-deployment";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";

interface Props extends StackProps {
    buildBucket: Bucket,
    distribution: Distribution,
}

const artifacts = {
    source: new Artifact("Source"),
    build: new Artifact("BuildOutput"),
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
            /*environmentVariables: {
                REPOSITORY_URI: {
                    value: props.repository.repositoryUri,
                },
                AWS_ACCOUNT_ID: {
                    value: stack.account,
                },
                AWS_STACK_REGION: {
                    value: stack.region,
                },
                GITHUB_AUTH_TOKEN: {
                    type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                    value: githubConfig.secreteManagerTokenArn,
                },
                CONTAINER_NAME: {
                    value: props.container.containerName,
                },
            },*/
        });

        project.addToRolePolicy(
            new PolicyStatement({
                actions: ["secretsmanager:GetSecretValue"],
                resources: [githubConfig.secreteManagerTokenArn],
            })
        );
        //props.repository.grantPullPush(project.grantPrincipal);

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

            /*deploy: new EcsDeployAction({
                actionName: APP+"-ECSDeploy",
                service: props.service,
                imageFile: new ArtifactPath(
                    artifacts.build,
                    DEPLOY_IMAGE_FILE,
                ),
            }),*/
            deploy: new S3DeployAction({
                actionName: APP+'-bucket-action',
                bucket: new BucketDeployment(this,APP+'-bucket',{
                    sources: [s3_deployment.Source.asset('out')],
                    destinationBucket: props.buildBucket,
                    distribution: props.distribution,
                }).deployedBucket,
                input: artifacts.source,
            }),
        }

        const pipeline = new Pipeline(this, APP+"-pipeline", {
            pipelineName: APP+"-pipeline",
            stages: [
                { stageName: "Source", actions: [pipelineActions.source] },
                { stageName: "Build", actions: [pipelineActions.build] },
                { stageName: "Deploy", actions: [pipelineActions.deploy] },
            ],
        })

        /*const pipeline = new CodePipeline(this, pipelineName, {
            pipelineName,
            crossAccountKeys: true,

            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub(
                    githubConfig.owner+'/'+githubConfig.repo,
                    githubConfig.branch,
                    {
                        authentication:SecretValue.secretsManager(githubConfig.secreteManagerTokenName),
                    //trigger:GitHubTrigger.WEBHOOK
                    }),
                commands:[

                ]
            }),
        });*/
    }
}