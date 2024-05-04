// import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class FovusStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'FovusQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const bucket = new s3.Bucket(this, 'MyUniqueBucket', {
      bucketName: `myapp-bucket-${Stack.of(this).account}-${Stack.of(this).region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    const table = new dynamodb.Table(this, 'MyUniqueTable', {
      tableName: `myapp-table-${Stack.of(this).account}-${Stack.of(this).region}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    const s3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [bucket.arnForObjects('*')],
    });
    const dynamoDbPolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:PutItem'],
      resources: [table.tableArn],
    });
    lambdaRole.addToPolicy(s3PolicyStatement);
    lambdaRole.addToPolicy(dynamoDbPolicyStatement);
    const myFunction = new lambda.Function(this, 'MyFunction', {
      code: lambda.Code.fromAsset('resources/lambda/gman-lambda'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      role: lambdaRole,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: table.tableName,
      },
    });
    const api = new apigateway.RestApi(this, 'MyApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    const lambdaIntegration = new apigateway.LambdaIntegration(myFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.resourceForPath('endpoint').addMethod('POST', lambdaIntegration);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 3,
    });
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access');


    const ec2Instance = new ec2.Instance(this, 'MyInstance', {
      vpc,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup: securityGroup,
    });
  }
}