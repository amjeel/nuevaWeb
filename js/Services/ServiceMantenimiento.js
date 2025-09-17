API_URL = "localhost:8080/api"; 

export async function getMantenimientos() {
  const res = await fetch(`${API_URL}/consultarMantenimiento`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`GET mantos → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function createMantenimiento(data) {
  const res = await fetch(`${API_URL}/registrarMantenimientos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST mantos → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function updateMantenimientos(idMantenimiento, data) {
  const res = await fetch(`${API_URL}/actualizarMantenimiento/${idMantenimiento}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`PUT mantos → ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteMantenimientos(idMantenimiento) {
  const res = await fetch(`${API_URL}/eliminarMantenimiento/${idMantenimiento}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`DELETE mantenimiento → ${res.status} ${await res.text()}`);
  return res.ok;
}
