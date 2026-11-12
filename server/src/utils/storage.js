
import { randomUUID } from "node:crypto";
import supabase from "../config/supabase.js";

const BUCKET_NAME = "docufortis-documents";

export async function uploadDocumentToStorage(
  file,
  userId,
  extension,
  mimeType
) {
  const storageKey = `${userId}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storageKey, file.buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storageKey;
}

export async function deleteDocumentFromStorage(storageKey) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storageKey]);

  if (error) {
    throw new Error(`Storage deletion failed: ${error.message}`);
  }
}
