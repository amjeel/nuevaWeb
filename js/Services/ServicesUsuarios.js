const API_URL = "http://localhost:8080/api"; 

export async function getUsuarios() {
    const res = await fetch(`${API_URL}/consultarUsuarios`);
    return res.json(); 
} 

export async function createUsuario(data) {
    await fetch (`${API_URL}/registrarUsuarios`, {
     method: "POST", 
     headers: {"Content-Type": "application/json"}, 
     body: JSON.stringify(data)
});
}

export async function updateUsuario(id, data) {
    await fetch(`${API_URL}/actualizarUsuarios/${idUsuario}`,{
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
}

export async function deleteCategory(id) {
    await fetch(`${API_URL}/eliminarUsuarios/${idUsuario}`, {
        method: "DELETE"
    }); 
}