export interface UploadActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  uploadedFileName: string | null;
}

export const initialUploadActionState: UploadActionState = {
  status: "idle",
  message: null,
  uploadedFileName: null,
};
