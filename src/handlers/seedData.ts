import { MOCK_PRODUCTS } from '../mocks/mockProducts';
import { cloneObject } from '../util/cloneObject';
import { PRODUCT_TABLE_NAME, STOCK_TABLE_NAME } from '../util/constants';
import * as AWS from 'aws-sdk';

export const seedData = () => {
  AWS.config.update({ region: 'eu-central-1' });

  const client = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: 'Products',
    Select: 'COUNT',
  };

  client.scan(params, (err, data) => {
    if (err) {
      console.error('Error scanning the table:', err);
    } else {
      const itemCount = data.Count;
      if (itemCount! > 0) {
        console.log(`Table has ${itemCount} item(s).`);
      } else {
        dataSeeder(client);
      }
    }
  });
};

const dataSeeder = (client: AWS.DynamoDB.DocumentClient) => {
  const putRequestsProducts = MOCK_PRODUCTS.map((product) => ({
    PutRequest: {
      Item: { ...cloneObject(product, ['count']) },
    },
  }));

  const putRequestsStocks = MOCK_PRODUCTS.map((product) => ({
    PutRequest: {
      Item: {
        product_id: product.id,
        count: product.count,
      },
    },
  }));

  const params = {
    RequestItems: {
      [PRODUCT_TABLE_NAME]: putRequestsProducts,
      [STOCK_TABLE_NAME]: putRequestsStocks,
    },
  };

  client.batchWrite(params, (err, _) => {
    if (err) {
      console.error('Error performing bulk write:', err);
    } else {
      console.log('Bulk write successful');
    }
  });
};
