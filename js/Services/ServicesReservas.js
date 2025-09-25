// js/Services/ServiceReservas.js
const API_URL = "http://localhost:8080/api";

// Helper para leer siempre el body (JSON o texto) y darte algo útil en errores
async function readBodySafe(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
function headersJSON() {
  return { "Content-Type": "application/json", "Accept": "application/json" };
}

export async function getReservas() {
  const res = await fetch(`${API_URL}/consultarReservas`, { headers: { Accept: "application/json" } });
  const body = await readBodySafe(res);
  if (!res.ok) {
    console.error("[GET reservas] error:", body);
    throw new Error(`GET reservas → ${res.status} ${JSON.stringify(body)}`);
  }
  return body; 
}

export async function createReservas(data) {
  const res = await fetch(`${API_URL}/registrarReservas`, {
    method: "POST",
    headers: headersJSON(),
    body: JSON.stringify(data)
  });
  const body = await readBodySafe(res);
  if (!res.ok) {
    console.error("[POST reservas] payload:", data, "error:", body);
    throw new Error(`POST reservas → ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function updateReservas(idReserva, data) {
  const res = await fetch(`${API_URL}/actualizarReservas/${idReserva}`, {
    method: "PUT",
    headers: headersJSON(),
    body: JSON.stringify(data)
  });
  const body = await readBodySafe(res);
  if (!res.ok) {
    console.error("[PUT reservas] id:", idReserva, "payload:", data, "error:", body);
    throw new Error(`PUT reservas → ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function deleteReservas(idReserva) {
  const res = await fetch(`${API_URL}/eliminarReservas/${idReserva}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  const body = await readBodySafe(res);
  if (!res.ok) {
    console.error("[DELETE reservas] id:", idReserva, "error:", body);
    throw new Error(`DELETE reservas → ${res.status} ${JSON.stringify(body)}`);
  }
  // muchos controllers devuelven 204 No Content
  return true;
}
