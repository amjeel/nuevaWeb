// js/Services/ServiceHabitaciones.js
const API_URL = "http://localhost:8080/api"; 

export async function getHabitaciones() {
  const res = await fetch(`${API_URL}/consultarHabitaciones`, {
    headers: { Accept: "application/json" },
    credentials: "include"
  });
  if (!res.ok) throw new Error(`GET habitaciones → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function createHabitaciones(data) {
  const res = await fetch(`${API_URL}/registrarHabitaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST habitaciones → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function updateHabitaciones(idHabitacion, data) {
  const res = await fetch(`${API_URL}/actualizarHabitaciones/${idHabitacion}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT habitaciones → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteHabitaciones(idHabitacion) {
  const res = await fetch(`${API_URL}/eliminarHabitaciones/${idHabitacion}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE habitaciones → ${res.status} ${await res.text()}`);
  return res.ok;
}
