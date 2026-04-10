import { api } from '@/src/lib/api/client';

type GenerateUploadURLResponse = {
  upload_url: string;
  object_key: string;
};

type ConfirmAvatarResponse = {
  avatar_url: string;
};

/**
 * Uploads an avatar via the signed URL flow:
 * 1. Request a signed upload URL from the backend
 * 2. PUT the image bytes directly to GCS via XMLHttpRequest
 * 3. Confirm the upload with the backend
 */
export const avatarService = {
  upload: async (imageUri: string): Promise<string> => {
    // Read the file as a blob to get size and type
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';
    const fileSize = blob.size;

    console.log('[avatar] blob info', {
      contentType,
      fileSize,
      blobType: blob.type,
      uri: imageUri,
    });

    // 1. Get signed upload URL
    const { upload_url, object_key } =
      await api.post<GenerateUploadURLResponse>('/customer/avatar/upload-url', {
        content_type: contentType,
        file_size: fileSize,
      });

    console.log('[avatar] got upload URL', {
      object_key,
      urlLength: upload_url.length,
    });

    // 2. Upload directly to GCS via XMLHttpRequest (more reliable in RN than axios for binary)
    try {
      await uploadToGCS(upload_url, blob, contentType);
      console.log('[avatar] GCS upload succeeded');
    } catch (err) {
      console.error('[avatar] GCS upload failed', err);
      throw err;
    }

    // 3. Confirm upload
    const { avatar_url } = await api.put<ConfirmAvatarResponse>(
      '/customer/avatar/confirm',
      { object_key },
    );

    console.log('[avatar] confirm succeeded', { avatar_url });

    return avatar_url;
  },
};

function uploadToGCS(
  url: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-goog-content-length-range', '0,5242880');
    xhr.onload = () => {
      console.log('[avatar] XHR onload', {
        status: xhr.status,
        response: xhr.responseText?.substring(0, 500),
      });
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(`GCS upload failed: ${xhr.status} ${xhr.responseText}`),
        );
      }
    };
    xhr.onerror = () => {
      console.error('[avatar] XHR onerror', {
        status: xhr.status,
        response: xhr.responseText,
      });
      reject(new Error('GCS upload network error'));
    };
    xhr.send(blob);
  });
}
