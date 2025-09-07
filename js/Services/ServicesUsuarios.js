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

export async function updateUsuario(idUsuario, data) {
    const res = await fetch(`${API_URL}/actualizarUsuarios/${idUsuario}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Error al actualizar usuario");
    return res.json();
}

export async function deleteUsuario(idUsuario) {
    const res = await fetch(`${API_URL}/eliminarUsuarios/${idUsuario}`, {
        method: "DELETE"
    }); 
    if (!res.ok) throw new Error("Error al eliminar usuario");
    return res.json();
}
