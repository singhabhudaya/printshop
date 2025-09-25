// /web/src/api/shopify.ts
const DOMAIN = (import.meta as any).env.VITE_SHOPIFY_STORE_URL?.replace(/https?:\/\//, "");
const TOKEN  = (import.meta as any).env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const GRAPHQL_URL = DOMAIN ? `https://${DOMAIN}/api/2024-07/graphql.json` : "";

async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}

export async function getCollectionWithProducts(handle: string, first = 4) {
  const q = `
    query CollectionWithProducts($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        image { url altText }
        products(first: $first) {
          edges {
            node {
              id
              handle
              title
              featuredImage { url altText }
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
            }
          }
        }
      }
    }
  `;
  const data = await gql<{ collectionByHandle: any }>(q, { handle, first });
  return data.collectionByHandle;
}
