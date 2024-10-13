import { getProductsList } from '../services/product-service';

export async function handler() {
  return await getProductsList();
}
