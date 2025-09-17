// js/Services/ServiceHabitaciones.js
const API_URL = "http://localhost:8080/api"; // sin / al final

export async function getCheckOut() {
  const res = await fetch(`${API_URL}/consultarCheckOuts`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`GET checkout → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function CreateCheckOut(data) {
  const res = await fetch(`${API_URL}/registrarCheckOuts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST checkout → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function updateCheckOut(idCheckOut, data) {
  const res = await fetch(`${API_URL}/actualizarCheckOuts/${idCheckOut}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT checkout → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteCheckOut(idCheckOut) {
  const res = await fetch(`${API_URL}/eliminarCheckOuts/${idCheckOut}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE checkout → ${res.status} ${await res.text()}`);
  return res.ok;
}
