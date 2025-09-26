const API_URL = "http://localhost:8080/api"; 

export async function getEmpleados(){
  const res = await fetch(`${API_URL}/consultarUsuarios`);
  return res.json();
}
 
export async function createEmpleados(data){
    await fetch(`${API_URL}/registrarUsuarios`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
}
 
export async function updateEmpleados(id, data){
    await fetch(`${API_URL}/actualizarUsuarios/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
}
 
export async function deleteEmpleados(id){
    await fetch(`${API_URL}/eliminarUsuarios/${id}`, {
        method: "DELETE"
    });
}
