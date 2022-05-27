import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {IVpc, Peer, Port, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {IRepository} from "aws-cdk-lib/aws-ecr";
import {Construct} from "constructs";
import {
    Cluster,
    CpuArchitecture,
    EcrImage,
    FargateService,
    FargateTaskDefinition,
    OperatingSystemFamily
} from "aws-cdk-lib/aws-ecs";
import {APP, CONTAINER_PORT, VPC_NAME} from "./Constants";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationProtocolVersion
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
    constructor(scope: Construct, id: string, private readonly props: Props) {
        super(scope, id, props);

        const cluster = new Cluster(this, APP+'-cluster', {
            vpc: props.vpc,
            clusterName: APP+'-cluster',
            containerInsights: true,
        });

        const albSg = new SecurityGroup(this, APP+'-alb-sg', {
            vpc: props.vpc,
            allowAllOutbound: true,
        });

        const loadBalancer = new ApplicationLoadBalancer(this, APP+'-alb', {
            vpc: props.vpc,
            loadBalancerName: APP+'-alb',
            internetFacing: true,
            idleTimeout: Duration.minutes(10),
            securityGroup: albSg,
            http2Enabled: false,
            deletionProtection: false,
        });

        const httpListener = loadBalancer.addListener('http listener', {
            port: 80,
            open: true,
        });

        const targetGroup = httpListener.addTargets(APP+'-alb-tcp-target', {
            targetGroupName: APP+'-alb-tcp-target',
            protocol: ApplicationProtocol.HTTP,
            protocolVersion: ApplicationProtocolVersion.HTTP1,
        });

        const taskDefinition = new FargateTaskDefinition(this, APP+'fargate-td', {
            runtimePlatform: {
                cpuArchitecture: CpuArchitecture.ARM64,
                operatingSystemFamily: OperatingSystemFamily.LINUX,
            },
        });

        const container = taskDefinition.addContainer(APP+'-container', {
            image: EcrImage.fromEcrRepository(props.repository),
            containerName: APP+'-container'
        });

        container.addPortMappings({
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

        const fargateService = new FargateService(this, APP+'-fargate-service', {
            cluster,
            assignPublicIp: false,
            taskDefinition,
            securityGroups: [securityGroup],
            desiredCount: 1,
        });
        targetGroup.addTarget(fargateService);


    }
}