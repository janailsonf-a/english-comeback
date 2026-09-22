import { validLocalRecordingReference } from "../journey/narrative/rules";
export function recordingReference(uri: string, documentsUri: string) {
  const root = documentsUri.endsWith("/") ? documentsUri : `${documentsUri}/`;
  if (!uri.startsWith(root))
    throw new Error("Recording is outside the local document directory.");
  const relative = uri.slice(root.length);
  if (!validLocalRecordingReference(relative))
    throw new Error("Invalid recording reference.");
  return relative;
}
