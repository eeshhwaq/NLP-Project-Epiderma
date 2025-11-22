const API_URL = "http://localhost:8000"; 

export async function analyzeImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Image analysis failed");
  return await res.json();
}

export async function sendChat(text: string) {
  const form = new FormData();
  form.append("text", text);

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    body: form
  });

  if (!res.ok) throw new Error("Chat failed");
  return await res.json();
}
