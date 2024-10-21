import * as productService from '../src/services/product-service'; // Import the service to mock it
import { handler } from '../src/handlers/getProductList';

// Mock data for tests
const mockProducts = [
  {
    id: '1',
    price: 19.99,
    title: 'JavaScript: The Good Parts',
    description:
      "A deep dive into the best features of JavaScript, focusing on the language's strengths and how to use them effectively.",
  },
  {
    id: '2',
    price: 25.5,
    title: "You Don't Know JS",
    description:
      "An in-depth series of books that explores JavaScript intricacies and the 'why' behind the language's behaviors.",
  },
];

// Mock the getProductsList function from the product service
jest.spyOn(productService, 'getProductsList').mockImplementation(async () => mockProducts);

describe('Lambda Handler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return the list of products', async () => {
    const result = await handler('');
    expect(result).toEqual(mockProducts);
  });

  test('should handle an empty product list', async () => {
    jest.spyOn(productService, 'getProductsList').mockImplementationOnce(async () => []);
    const result = await handler('');
    expect(result).toEqual([]);
  });
});
