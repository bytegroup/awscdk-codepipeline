import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {IVpc, Peer, Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {Construct} from "constructs";
import { aws_iam as iam } from 'aws-cdk-lib';
import {
    Cluster, ContainerDefinition,
    CpuArchitecture,
    EcrImage,
    FargateService,
    FargateTaskDefinition, LogDrivers,
    OperatingSystemFamily
} from "aws-cdk-lib/aws-ecs";
import {APP, CONTAINER_PORT, VPC_NAME} from "../constants/Constants";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationProtocolVersion, ListenerAction, SslPolicy
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

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
            internetFacing: true,
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
        });
        /*this.service.taskDefinition.taskRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                actions: [
                    'ssmmessages:CreateControlChannel',
                    'ssmmessages:CreateDataChannel',
                    'ssmmessages:OpenControlChannel',
                    'ssmmessages:OpenDataChannel',
                ],
                resources: ['*'],
            }),
        );*/
        //cdk.Aspects.of(this.service).add(new EnableExecuteCommand());
        targetGroup.addTarget(this.service);
    }
}