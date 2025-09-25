import {
  getUsuarios,
  createUsuarios,
  updateUsuarios,
  deleteUsuarios
} from "../Services/ServicesUsuarios.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody= document.querySelector("UsersTable tbody");
  const form = document.getElementById("UsersForm");
  const modal = new bootstrap.Modal(document.getElementById("UsuariosModal"));
  const lbModal = document.getElementById("usersModalLable");
  const btnAdd = document.getElementById("btnaddUsuario");

  loadUsers();

  btnAdd.addEventListener("click", () =>{
    form.reset();
    form.usersId.value = "" ;
    lbModal.textContent = "Agregar Usuarios";
    modal.show();
  });

  form.addEventListener("submit", async (e) =>{
    e.preventDefault();

    const id = form.usersId.value;

    const data = {
      nombreUusuario: form.userName.value.trim(),
      
    }
  })
})