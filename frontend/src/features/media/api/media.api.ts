/**
 * Media API — file upload to WABridge
 */

import { config } from "@/lib/config";


export interface MediaUploadResponse {
  mediaRef: string;
  expiresAt: string;
  url: string;
}

/**
 * Upload a media file to the backend (which proxies to WABridge).
 * Returns a `mediaRef` valid for ~2 hours.
 */
export async function uploadMedia(
  file: File,
  mediaType: "image" | "video" | "document",
): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);

  const response = await fetch(`${config.apiBaseUrl}/api/media/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Media upload failed: ${errorText}`);
  }

  return response.json();
}
