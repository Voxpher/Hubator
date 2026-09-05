/* =========================================================
   Cloudinary image upload — for the product edit form.
   -----------------------------------------------------------
   Setup (see chat for full steps):
   1. Sign up free at cloudinary.com
   2. Copy your Cloud Name from the dashboard
   3. Settings > Upload > Add upload preset > Signing Mode: Unsigned
   4. Fill in the two constants below
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";   // e.g. "dxy123abc"
const CLOUDINARY_UPLOAD_PRESET = "YOUR_PRESET_NAME"; // the unsigned preset you created

/**
 * Uploads a File (from an <input type="file"> or drag-drop) to Cloudinary.
 * Returns the permanent image URL to save on the product record.
 */
export async function uploadProductImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "products"); // keeps product images organized in Cloudinary

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error("Image upload failed — check your Cloud Name and preset name.");
  }
  const data = await res.json();
  return data.secure_url; // save this URL with the product
}

/* ---------------------------------------------------------
   Example usage in a React product-edit form:

   const [uploading, setUploading] = useState(false);

   async function handleFileChange(e) {
     const file = e.target.files[0];
     if (!file) return;
     setUploading(true);
     try {
       const imageUrl = await uploadProductImage(file);
       setProduct(prev => ({ ...prev, image: imageUrl }));
     } catch (err) {
       console.error(err);
       alert("Upload failed, try again.");
     } finally {
       setUploading(false);
     }
   }

   <input type="file" accept="image/*" onChange={handleFileChange} />
   {uploading && <span>Uploading…</span>}
   {product.image && <img src={product.image} alt="Product" />}
--------------------------------------------------------- */
