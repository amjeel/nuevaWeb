const API_URL = "http://localhost:8080/api"; 

export async function getUsuarios(){
  const res = await fetch(`${API_URL}/consultarUsuarios`, {
    credentials: "include",
  });
  return res.json();
}

export async function createUsuarios(data){
    await fetch(`${API_URL}/registrarUsuarios`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
}
 
export async function updateUsuarios(id, data){
    await fetch(`${API_URL}/actualizarUsuarios/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(data)
    });
}
 
export async function deleteUsuarios(id){
    await fetch(`${API_URL}/eliminarUsuarios/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
}
