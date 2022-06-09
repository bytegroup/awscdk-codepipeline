import {Environment} from "aws-cdk-lib";

export const AWS_ENV_STG: Environment = {
    account: '361854753178',
    region: 'ap-northeast-1'
}
export const AWS_ENV_PROD: Environment = {
    account: '716993826013',
    region: 'ap-northeast-1'
}

export const githubConfig = {
    owner: 'toggle-inc',
    repo: 'mine_map_app_client',
    branch: 'cicd',
    //secreteManagerTokenName:'github-token-cicd-npipeline-demo',
    secreteManagerTokenName:'github-secret-token',
    secreteManagerTokenArn:'arn:aws:secretsmanager:ap-northeast-1:361854753178:secret:github-secret-token-ABvX7J',
}

export const STAGING_WEB_CONFIG = {
    baseDomainName: 'staging.mine.toggle-pf.com',
    hostedZoneId: 'Z0027987VXSPGRROHS3A',
    domainName: 'map-app.staging.mine.toggle-pf.com',
    appEnv: 'staging',
};

export const PROD_WEB_CONFIG = {
    baseDomainName: 'toggle-pf.com',
    hostedZoneId: 'Z0059839IPFJ7TFOFCQH',
    domainName: 'map-app.staging.mine.toggle-pf.com',
    appEnv: 'production',
};

export const APP = 'mine-map-client-tmp';

export const TAGS = {
    'Author': "Mizanur",
}

export const DEPLOY_IMAGE_FILE="deploy_bundle.json";
export const HOST_BUCKET = "minemap-client-host-tmp";
export const RESOURCE_BUCKET = "codepipeline-resources-cdk-tmp";