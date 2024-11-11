import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddbClient = new DynamoDBClient({ region: 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const isValidProduct = (
  title: string,
  description: string,
  price: number,
  count: number
) => {
  if (!title || !description || !price || price <= 0 || count < 0) {
    return false;
  }
  return true;
};

export const handler = async (event: any) => {
  const { title, description, price, count } = JSON.parse(event.body);
  console.log('eventINFO', event.body);
  console.log('ProductINFO', title, description, price, count);

  const id = randomUUID();

  if (!isValidProduct(title, description, price, count)) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Invalid product data',
      }),
    };
  }

  const productParams = {
    TableName: 'Products',
    Item: {
      id,
      title,
      description,
      price,
    },
  };

  const stockParams = {
    TableName: 'Stock',
    Item: {
      product_id: id,
      count: count,
    },
  };

  try {
    await docClient.send(new PutCommand(productParams));
  } catch (error: any) {
    console.error('Error adding product to ProductsTable:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to add product to ProductsTable',
        error: error.errorMessage,
      }),
    };
  }

  try {
    await docClient.send(new PutCommand(stockParams));
  } catch (error: any) {
    console.error('Error adding stock info to StocksTable:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to add stock information to StocksTable',
        error: error.errorMessage,
        productId: id,
      }),
    };
  }

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: 'Product created successfully',
      productId: id,
    }),
  };
};
