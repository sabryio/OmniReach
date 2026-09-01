/**
 * useMediaUpload — hook for uploading media files
 */

import { useMutation } from "@tanstack/react-query";
import { uploadMedia } from "../api/media.api";

export function useMediaUpload() {
  const mutation = useMutation({
    mutationFn: ({
      file,
      mediaType,
    }: {
      file: File;
      mediaType: "image" | "video" | "document";
    }) => uploadMedia(file, mediaType),
  });

  return {
    uploadMedia: mutation.mutate,
    uploadMediaAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
