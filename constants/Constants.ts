import {Environment} from "aws-cdk-lib";

export const AWS_ENV: Environment = {
    account: '716993826013',
    region: 'ap-northeast-1'
}

export const githubConfig = {
    owner: 'toggle-inc',
    repo: 'mine_map_app_client',
    branch: 'master',
    //secreteManagerTokenName:'github-token-cicd-npipeline-demo',
    secreteManagerTokenName:'github-secret-token',
    secreteManagerTokenArn:'arn:aws:secretsmanager:ap-northeast-1:716993826013:secret:github-secret-token-0oR5Qz',
}

export const STAGING_WEB_CONFIG = {
    baseDomainName: 'toggle-pf.com',
    hostedZoneId: 'Z0059839IPFJ7TFOFCQH',
    domainName: 'map-app.mine.toggle-pf.com',
    appEnv: 'production',
};

export const APP = 'mine-map-app-client';

export const TAGS = {
    'Author': "Mizanur",
}

export const DEPLOY_IMAGE_FILE="deploy_bundle.json";
export const HOST_BUCKET = "minemap-client-host-prod";
export const RESOURCE_BUCKET = "mine-map-resources";