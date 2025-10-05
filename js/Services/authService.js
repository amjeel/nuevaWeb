const API_AUTH ="http://localhost:8080/api"

export async function login({ correoUsuario, contraseñaUsuario}) 
{
    const r = await fetch (`${API_AUTH}/authLogin`,{
        method: "POST",
        Headers: { "Content-type": "application/json"},
        credentials: "include",
        body: JSON.stringify({ correoUsuario, contraseñaUsuario}),
    });
    if (!r.ok) throw new Error(await r.text().catch(() => ""));
}

// Verifica el estado de autenticación actual
export async function me() {
  const info = await fetch(`${API_AUTH}/authMe`, {
    credentials: "include"
  });
  return info.ok ? info.json() : { authenticated: false }; // devuelve info del usuario o false
}

// Cierra la sesión del usuario
export async function logout() {
  try {
    const r = await fetch(`${API_AUTH}/logout`, {
      method: "POST",
      credentials: "include", // necesario para que el backend identifique la sesión
    });
    return r.ok; // true si el logout fue exitoso
  } catch {
    return false; // false en caso de error de red u otro fallo
  }
}