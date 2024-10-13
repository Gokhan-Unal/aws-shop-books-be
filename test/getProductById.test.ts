import { handler } from '../src/handlers/getProductById';
import { getProductById } from '../src/services/product-service';

jest.mock('../src/services/product-service');

const mockProductItem = {
  id: '1',
  price: 19.99,
  title: 'JavaScript: The Good Parts',
  description:
    "A deep dive into the best features of JavaScript, focusing on the language's strengths and how to use them effectively.",
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('getProductsById handler should return product by id', async () => {
  jest.mocked(getProductById).mockResolvedValue(mockProductItem);

  const result = await handler({ id: mockProductItem.id });

  expect(getProductById).toHaveBeenCalledWith(mockProductItem.id);
  expect(result).toBe(mockProductItem);
});

test('getProductsById handler should throw an error when product not found', () => {
  jest.mocked(getProductById).mockResolvedValue(undefined);

  expect(handler({ id: mockProductItem.id })).rejects.toThrow('Product not found');
});
