import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
  const { id } = event.pathParameters;
  console.log('event', event.pathParameters);
  console.log('Product INFO GET ID', id);

  const productParams = {
    TableName: 'Products',
    Key: { id: id },
  };

  const stockParams = {
    TableName: 'Stock',
    Key: { product_id: id },
  };

  try {
    const productResult = await docClient.send(new GetCommand(productParams));
    const product = productResult.Item;

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const stockResult = await docClient.send(new GetCommand(stockParams));
    const stock = stockResult.Item;

    const merge = {
      ...product,
      count: stock ? stock.count : 0,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(merge),
    };
  } catch (error: any) {
    console.error('Error: ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not retrieve product information',
        error: error.errorMessage,
      }),
    };
  }
};
