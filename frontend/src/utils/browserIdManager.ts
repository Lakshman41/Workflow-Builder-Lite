const STORAGE_KEY = "workflow-builder-browser-id";

export function getBrowserId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setBrowserId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}
