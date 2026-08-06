const DEVICE_ID_KEY = "sgt_device_id";

/** Stable per-browser identifier used as one factor in vote deduplication. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
