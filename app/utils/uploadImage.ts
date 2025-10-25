import { storage } from "@/firebase/firebaseClient";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export async function uploadImage(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!file) throw new Error("No file selected");

  return new Promise((resolve, reject) => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `profilePictures/${userId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}
