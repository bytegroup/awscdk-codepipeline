import {SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {ContainerDefinition, IBaseService, ICluster} from "aws-cdk-lib/aws-ecs";
import {APP, DEPLOY_IMAGE_FILE, githubConfig} from "../constants/Constants";
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
import {
    CodeBuildAction,
    EcsDeployAction,
    GitHubSourceAction,
    GitHubTrigger
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
    BuildEnvironmentVariableType,
    BuildSpec,
    EventAction,
    FilterGroup,
    GitHubSourceCredentials,
    LinuxBuildImage,
    Project,
    Source
} from "aws-cdk-lib/aws-codebuild";
import {Artifact, ArtifactPath, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildCommands} from "../constants/build.commands";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

interface Props extends StackProps {
    repository: IRepository
    service: IBaseService
    cluster: ICluster
    container: ContainerDefinition
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
            webhook: true,
            webhookFilters: [
                FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(githubConfig.branch),
            ],
        })

        const stack = Stack.of(this);
        const buildSpec = new BuildCommands().getBuildSpec();
        const project = new Project(this, APP+"-project", {
            projectName: APP+"-project",
            buildSpec,
            source,
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
                privileged: true,
            },
            environmentVariables: {
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
            },
        });

        project.addToRolePolicy(
            new PolicyStatement({
                actions: ["secretsmanager:GetSecretValue"],
                resources: [githubConfig.secreteManagerTokenArn],
            })
        );
        props.repository.grantPullPush(project.grantPrincipal);

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

            deploy: new EcsDeployAction({
                actionName: APP+"-ECSDeploy",
                service: props.service,
                imageFile: new ArtifactPath(
                    artifacts.build,
                    DEPLOY_IMAGE_FILE,
                ),
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