const API_URL = "http://localhost:8080/api"; // sin barra final

async function parse(res) {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  return { ok: res.ok, status: res.status, body };
}

function fail(prefix, out) {
  const detail = typeof out.body === "string" ? out.body : JSON.stringify(out.body);
  throw new Error(`${prefix} → ${out.status} ${detail}`);
}

export async function getUsuarios() {
  const res = await fetch(`${API_URL}/consultarUsuarios`, { headers:{Accept:"application/json"} });
  const out = await parse(res);
  if (!out.ok) fail("GET /consultarUsuarios", out);
  return out.body;
}

export async function createUsuario(data) {
  const res = await fetch(`${API_URL}/registrarUsuarios`, {
    method: "POST",
    headers: { "Content-Type":"application/json", Accept:"application/json" },
    body: JSON.stringify(data)
  });
  const out = await parse(res);
  if (!out.ok) fail("POST /registrarUsuarios", out);
  return out.body;
}

export async function updateUsuario(id, data) {
  const res = await fetch(`${API_URL}/actualizarUsuarios/${id}`, { // ← ojo la barra
    method: "PUT",
    headers: { "Content-Type":"application/json", Accept:"application/json" },
    body: JSON.stringify(data)
  });
  const out = await parse(res);
  if (!out.ok) fail(`PUT /actualizarUsuarios/${id}`, out);
  return out.body;
}

export async function deleteUsuario(id) {
  const res = await fetch(`${API_URL}/eliminarUsuarios/${id}`, { method:"DELETE", headers:{Accept:"application/json"} });
  if (res.status === 204) return true;
  const out = await parse(res);
  if (!out.ok) fail(`DELETE /eliminarUsuarios/${id}`, out);
  return out.body;
}
