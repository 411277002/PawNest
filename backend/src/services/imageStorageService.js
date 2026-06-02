export async function normalizeImagePayload(imageUrlOrBase64) {
  // In the deployment diagram this is the Image Storage Service adapter.
  // The current local version stores image data or URLs in DB columns such as image_url/photo_url.
  // Later this function can upload to Cloudinary, S3, Firebase Storage, etc.
  return imageUrlOrBase64 || null;
}
