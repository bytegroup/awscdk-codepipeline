import {Aspects, Duration, IAspect, Stack, StackProps} from "aws-cdk-lib";
import {IVpc, Peer, Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {Construct, IConstruct} from "constructs";
import { aws_iam as iam } from 'aws-cdk-lib';
import {
    CfnService,
    Cluster, ContainerDefinition,
    CpuArchitecture,
    EcrImage, EnvironmentFile,
    FargateService,
    FargateTaskDefinition, LogDrivers,
    OperatingSystemFamily
} from "aws-cdk-lib/aws-ecs";
import {APP, CONTAINER_PORT, RESOURCE_BUCKET} from "../constants/Constants";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationProtocolVersion, ListenerAction, SslPolicy
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {ManagedPolicy, Policy, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";

interface Props extends StackProps {
  vpc: IVpc;
  repository: IRepository;
}
/**
* Vpc.fromLookup(this, VPC_NAME, {
                vpcId: 'vpc-00f205a96f9862cb2',
                vpcName: VPC_NAME,
                isDefault: false
            }),
    */
export class ElasticContainerStack extends Stack {

    public readonly loadBalancer: ApplicationLoadBalancer
    public readonly container: ContainerDefinition
    public readonly service: FargateService
    public readonly cluster: Cluster

    constructor(scope: Construct, id: string, private readonly props: Props) {
        super(scope, id, props);

        this.cluster = new Cluster(this, APP+'-cluster', {
            vpc: props.vpc,
            clusterName: APP+'-cluster',
            containerInsights: true,
        });

        const albSg = new SecurityGroup(this, APP+'-alb-sg', {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        //albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443));

        this.loadBalancer = new ApplicationLoadBalancer(this, APP+'-alb', {
            vpc: props.vpc,
            loadBalancerName: APP+'-alb',
            internetFacing: false,
            idleTimeout: Duration.minutes(10),
            securityGroup: albSg,
            http2Enabled: false,
            deletionProtection: false,
        });

        const httpListener = this.loadBalancer.addListener('http listener', {
            port: 80,
            open: true,
            /*defaultAction: ListenerAction.redirect({
                port: "443",
                protocol: ApplicationProtocol.HTTPS,
            }),*/
        });

        /*const sslListener = this.loadBalancer.addListener("secure https listener", {
            port: 443,
            open: true,
            sslPolicy: SslPolicy.RECOMMENDED,
            certificates: [{certificateArn: CERTIFICATE_ARN}],
        })*/

        const targetGroup = httpListener.addTargets(APP+'-alb-target', {
            targetGroupName: APP+'-alb-target',
            protocol: ApplicationProtocol.HTTP,
            protocolVersion: ApplicationProtocolVersion.HTTP1,
        });

        const taskDefinition = new FargateTaskDefinition(this, APP+'-fargate-td', {
            /*runtimePlatform: {
                cpuArchitecture: CpuArchitecture.ARM64,
                operatingSystemFamily: OperatingSystemFamily.LINUX,
            },*/

            memoryLimitMiB: 2048,
            cpu: 1024,
        });

        this.container = taskDefinition.addContainer(APP+'-container', {
            image: EcrImage.fromEcrRepository(props.repository),
            containerName: APP+'-container',
            logging: LogDrivers.awsLogs({
                streamPrefix: 'ECS/minemapapp-stg-server',
            }),
            environmentFiles:[
                EnvironmentFile.fromBucket(Bucket.fromBucketName(this, APP+'-bucket', RESOURCE_BUCKET),'commonEnvProd.env'),
                //EnvironmentFile.fromBucket(Bucket.fromBucketArn(this, 'test', 'arn:aws:s3:::codepipeline-resources-cdk/commonEnv.env'),'commonEnv.env'),
            ],
        });
        this.container.addPortMappings({
            containerPort: CONTAINER_PORT,
        });

        const securityGroup = new SecurityGroup(this, APP+'-http-sg', {
            vpc: props.vpc,
        });
        securityGroup.addIngressRule(
            Peer.securityGroupId(albSg.securityGroupId),
            Port.tcp(CONTAINER_PORT),
            'Allow inbound connections from '+APP+' ALB'
        );

        this.service = new FargateService(this, APP+'-fargate', {
            cluster: this.cluster,
            assignPublicIp: false,
            taskDefinition,
            securityGroups: [securityGroup],
            desiredCount: 1,
            enableExecuteCommand: true,
        });


        this.service.taskDefinition.executionRole?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")
        );

        //ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess");
        //this.service.taskDefinition.addToTaskRolePolicy(PolicyStatement.fromJson({}));
        this.service.taskDefinition.taskRole.addToPrincipalPolicy(
            new PolicyStatement({
                actions: [
                    /*'s3:GetObject',
                    's3:GetBucketLocation',*/
                    's3:*',
                    'ssmmessages:CreateControlChannel',
                    'ssmmessages:CreateDataChannel',
                    'ssmmessages:OpenControlChannel',
                    'ssmmessages:OpenDataChannel',
                ],
                resources: ['*'],
            }),
        );
        /*Aspects.of(this.service).add(new class implements IAspect {
            public visit(node: IConstruct) {
                if (node instanceof CfnService){
                    node.addOverride('Properties.EnableExecuteCommand', true);
                }
            }
        });*/
        targetGroup.addTarget(this.service);
    }
}