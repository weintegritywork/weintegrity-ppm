
export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from sessionStorage key "${key}":`, error);
    return null;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    const serializedValue = JSON.stringify(value);
    window.sessionStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error writing to sessionStorage key "${key}":`, error);
  }
}
