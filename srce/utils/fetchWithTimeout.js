export async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Timeout gilt auch beim Lesen der Antwort.
    const text = await response.text();

    response.text = async () => text;
    response.json = async () => JSON.parse(text);

    return response;
  } finally {
    clearTimeout(timer);
  }
}