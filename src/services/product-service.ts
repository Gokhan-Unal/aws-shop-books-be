import { bookProducts } from '../constants/products';

export const getProductsList = async () => {
  return bookProducts;
};

export const getProductById = async (id: string) => {
  return bookProducts.find((product) => product.id === id);
};
