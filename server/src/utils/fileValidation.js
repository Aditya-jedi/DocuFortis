
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function validateFileContent(file) {
  if (!file?.buffer) {
    throw new Error("No file content received.");
  }

  // Plain text files don't have a recognizable file signature.
  if (file.mimetype === "text/plain") {
    const content = file.buffer.toString("utf8");

    if (content.includes("\0")) {
      throw new Error("Invalid text file.");
    }

    return {
      mimeType: "text/plain",
      extension: "txt",
    };
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || !allowedMimeTypes.has(detectedType.mime)) {
    throw new Error("Invalid or unsupported file content.");
  }

  if (detectedType.mime !== file.mimetype) {
    throw new Error("File content does not match its declared MIME type.");
  }

  return {
    mimeType: detectedType.mime,
    extension: detectedType.ext,
  };
}
