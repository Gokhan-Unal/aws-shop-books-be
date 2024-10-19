import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import * as path from 'path';

export class AwsShopBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productListLambda = new lambda.Function(this, 'ProductListLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/getProductList.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
    });

    const getProductByIdLambda = new lambda.Function(this, 'GetProductByIdLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/getProductById.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
    });

    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
      description: 'Product Service API',
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['https://d1psre7xuwrpjr.cloudfront.net', 'http://localhost:3000'],
        allowMethods: ['GET', 'OPTIONS'],
      },
    });

    const productListLambdaIntegration = new apigateway.LambdaIntegration(productListLambda, {
      requestTemplates: {
        'application/json': `{}`,
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'https://d1psre7xuwrpjr.cloudfront.net'",
            'method.response.header.Access-Control-Allow-Methods': "'GET, OPTIONS'",
            'method.response.header.Access-Control-Allow-Headers': "'*'",
          },
        },
      ],
      proxy: false,
    });

    const productResource = api.root.addResource('products');
    const productByIdResource = productResource.addResource('{id}');

    productResource.addMethod('GET', productListLambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
        },
      ],
    });

    productByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductByIdLambda, {
        requestTemplates: {
          'application/json': `{ "id": "$input.params('id')" }`,
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
          {
            statusCode: '404',
            selectionPattern: 'Product not found',
            responseTemplates: {
              'application/json': '{"message": "Product not found"}',
            },
          },
        ],
        proxy: false,
      }),
      {
        methodResponses: [{ statusCode: '200' }, { statusCode: '404' }],
      }
    );
  }
}
