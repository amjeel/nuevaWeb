const API_URL = "http://localhost:8080/api"; 

export async function getUsuarios() {
    const res = await fetch(`${API_URL}/consultarUsuarios`);
    if (!res.ok) throw new Error("Error al consultar usuarios");
    return res.json(); 
} 

export async function createUsuario(data) {
    const res = await fetch(`${API_URL}/registrarUsuarios`, {
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Error al registrar usuario");
    return res.json();
}

export async function updateUsuario(id, data) {
    const res = await fetch(`${API_URL}actualizarUsuarios/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Error al actualizar usuario");
    return res.json();
}

export async function deleteUsuario(id) {
    const res = await fetch(`${API_URL}/eliminarUsuarios/${id}`, {
        method: "DELETE"
    }); 
    if (!res.ok) throw new Error("Error al eliminar usuario");
    return res.json();
}
