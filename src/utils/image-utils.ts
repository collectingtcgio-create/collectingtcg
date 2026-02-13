/**
 * Utility to compress a base64 image string or File object
 * @param base64OrFile The image as a base64 string or File object
 * @param maxWidth The maximum width for the compressed image
 * @param quality The quality of the compression (0 to 1)
 * @returns A promise that resolves to the compressed base64 string
 */
export async function compressImage(
    base64OrFile: string | File,
    maxWidth = 1200,
    quality = 0.7
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Get the compressed base64
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
        };

        img.onerror = (err) => {
            reject(new Error("Failed to load image for compression"));
        };

        if (typeof base64OrFile === "string") {
            img.src = base64OrFile;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(base64OrFile);
        }
    });
}
