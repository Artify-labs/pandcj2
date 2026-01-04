// Helper function to create URL-friendly slugs from product names
export function generateProductSlug(productName, productId) {
  if (!productName) return productId;
  
  // Convert product name to slug: lowercase, replace spaces with hyphens, remove special chars
  const slug = productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  
  // Include ID at the end for unique identification
  return `${slug}-${productId}`;
}

// Helper function to extract product ID from slug
export function extractProductIdFromSlug(slug) {
  if (!slug) return null;
  
  // The ID is the last segment after the last hyphen (UUID format)
  const parts = slug.split('-');
  
  // UUID format: 8-4-4-4-12 = 36 chars with hyphens
  // We need to find where the UUID starts
  // A UUID v4 starts with hex chars, so we look for the last valid UUID pattern
  
  for (let i = parts.length - 1; i >= 0; i--) {
    const possibleId = parts.slice(i).join('-');
    // Check if it matches UUID format (roughly)
    if (possibleId.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
      return possibleId;
    }
  }
  
  // Fallback: assume the entire string is the ID
  return slug;
}
