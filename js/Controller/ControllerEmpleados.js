import {
  getEmpleados,
  createEmpleados,
  updateEmpleados,
  deleteEmpleados
} from "../Services/ServiceEmpleados.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("EmpleadosForm");
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