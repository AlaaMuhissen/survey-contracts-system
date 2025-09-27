import { FirestoreTimestampJSON } from "../admin/types";

export function tsToMs(ts?: FirestoreTimestampJSON) {
  return ts?._seconds ? ts._seconds * 1000 : null;
}
