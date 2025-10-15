// js/Services/ServiceHabitaciones.js
const API_URL = "http://localhost:8080/api"; // sin / al final

export async function getCheckIn() {
  const res = await fetch(`${API_URL}/consultarCheckIns`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET CheckIn → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function createCheckIn(data) {
  const res = await fetch(`${API_URL}/registrarCheckIns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST CheckIn → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function updateCheckIn(idCheckIn, data) {
  const res = await fetch(`${API_URL}/actualizarCheckIns/${idCheckIn}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT CheckIn → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteCheckIn(idCheckIn) {
  const res = await fetch(`${API_URL}/eliminarCheckIns/${idCheckIn}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE CheckIn → ${res.status} ${await res.text()}`);
  return res.ok;
}
