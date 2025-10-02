// js/Services/ServiceEmpleados.js
const API_URL = "http://localhost:8080/api";

// GET: Obtener empleados (paginado o lista completa)
export async function getEmpleados() {
  const res = await fetch(`${API_URL}/consultarEmpleados`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`GET empleados → ${res.status} ${await res.text()}`);
  return res.json();
}

// POST: Crear empleado
export async function createEmpleados(data) {
  const res = await fetch(`${API_URL}/registrarEmpleados`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST empleados → ${res.status} ${await res.text()}`);
  return res.json();
}

// PUT: Actualizar empleado
export async function updateEmpleados(idEmpleado, data) {
  const res = await fetch(`${API_URL}/actualizarEmpleados/${idEmpleado}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT empleados → ${res.status} ${await res.text()}`);
  return res.json();
}

// DELETE: Eliminar empleado
export async function deleteEmpleados(idEmpleado) {
  const res = await fetch(`${API_URL}/eliminarEmpleados/${idEmpleado}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE empleados → ${res.status} ${await res.text()}`);
  return res.ok;
}
