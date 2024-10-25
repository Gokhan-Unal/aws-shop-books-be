import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
  console.log('eventINFO', event);
  try {
    const productsCommand = new ScanCommand({ TableName: 'Products' });
    const productsData = await docClient.send(productsCommand);
    const products = productsData.Items;

    const stocksCommand = new ScanCommand({ TableName: 'Stock' });
    const stocksData = await docClient.send(stocksCommand);
    const stocks = stocksData.Items;

    console.log('ProductsINFO', products, stocks);

    const merge = products?.map((product) => {
      const stock = stocks?.find((stock) => stock.product_id === product.id);
      return {
        ...product,
        count: stock?.count ?? 0,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(merge),
    };
  } catch (error: any) {
    console.error('Error: ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.errorMessage,
      }),
    };
  }
};
