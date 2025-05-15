import axios from 'axios';
import toast from 'react-hot-toast';

async function uploadToCloudinary(file: any) {
    console.log("🚀 ~ uploadToCloudinary ~ file:", file)
    if (!file) toast.error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", `${process.env.NEXT_PUBLIC_CLOUDNAIRY_UPLOAD_PRESET}`);

    try {
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDNAIRY_KEY}/image/upload`,
            formData
        );
        return {
            URL: response.data.secure_url
        }

    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        toast.error("Failed to upload image. Please try again.");
        return {
            error: "Error uploading to Cloudinary:"
        }
    }
}

export default uploadToCloudinary;