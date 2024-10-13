import { getProductById } from '../services/product-service';

export async function handler(event: any) {
  const product = await getProductById(event.id);

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
}
