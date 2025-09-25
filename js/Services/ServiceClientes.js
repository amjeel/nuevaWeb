// js/Services/ServiceHabitaciones.js
const API_URL = "http://localhost:8080/api";

export async function getClientes() {
  const res = await fetch(`${API_URL}/consultarClientes`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`GET Clientes → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function createClientes(data) {
  const res = await fetch(`${API_URL}/registrarClientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST Clientes → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function updateClientes(idCliente, data) {
  const res = await fetch(`${API_URL}/actualizarClientes/${idCliente}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT Clientes → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteClientes(idCliente) {
  const res = await fetch(`${API_URL}/eliminarClientes/${idCliente}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE Clientes → ${res.status} ${await res.text()}`);
  return res.ok;
}