// js/Controller/ControllerEmpleados.js
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from "../Services/ServiceEmpleados";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector(".data-table tbody");
  const btnNuevo = document.getElementById("btn-abrir");
  const searchInput = document.querySelector(".search-input");
  const btnExport = document.querySelector(".btn-export");

  const modal = new bootstrap.Modal(document.getElementById("EmpleadosModal"));
  const form = document.getElementById("empleadosForm");

  const inputId = document.getElementById("empleadosId");
  const inputNombre = document.getElementById("empleadosName");
  const inputApellido = document.getElementById("empleadosApellido");
  const inputTelefono = document.getElementById("empleadosTelefono");
  const inputDui = document.getElementById("empleadosDui");
  const inputNacimiento = document.getElementById("empleadosNacimiento");
  const inputDireccion = document.getElementById("empleadosDireccion");
  const inputSalario = document.getElementById("empleadosSalario");
  const selectCargo = document.getElementById("empleadosCargo");
  const selectUsuario = document.getElementById("empleadosUsuario");

  let DATA = [];
  let CARGOS = [];
  let USUARIOS = [];

  const toast = (icon = "success", title = "") =>
    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon,
      title,
      timer: 1600,
      showConfirmButton: false,
      timerProgressBar: true,
    });

  const pintarTabla = (data) => {
    tbody.innerHTML = "";
    if (!data.length) return tbody.innerHTML = `<tr><td colspan='5'>Sin resultados</td></tr>`;

    data.forEach((e) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.nombreEmpleado}</td>
        <td>${e.apellidoEmpleado}</td>
        <td>${e.Usuario.correo}</td>
        <td>${e.Cargo.nombreCargo}</td>
        <td>
          <button class='btn-edit btn btn-sm btn-primary'><i class='fas fa-edit'></i></button>
          <button class='btn-delete btn btn-sm btn-danger'><i class='fas fa-trash'></i></button>
        </td>`;

      const [btnEdit, btnDelete] = tr.querySelectorAll(".btn");

      btnEdit.addEventListener("click", () => {
        inputId.value = e.idEmpleado;
        inputNombre.value = e.nombreEmpleado;
        inputApellido.value = e.apellidoEmpleado;
        inputTelefono.value = e.telefonoEmpleado;
        inputDui.value = e.duiEmpleado;
        inputNacimiento.value = e.nacimientoEmpleado;
        inputDireccion.value = e.direccionEmpleado;
        inputSalario.value = e.salarioEmpleado;
        selectCargo.value = e.Cargo?.idCargo || "";
        selectUsuario.value = e.Usuario?.idUsuario || "";
        modal.show();
      });

      btnDelete.addEventListener("click", async () => {
        const r = await Swal.fire({
          title: `Eliminar a ${e.nombreEmpleado}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
        });
        if (r.isConfirmed) {
          await deleteEmpleado(e.idEmpleado);
          toast("success", "Empleado eliminado");
          cargarDatos();
        }
      });

      tbody.appendChild(tr);
    });
  };

  const cargarCargos = async () => {
    CARGOS = await getCargos();
    selectCargo.innerHTML = `<option value=''>Seleccione un cargo</option>`;
    CARGOS.forEach(c => {
      selectCargo.innerHTML += `<option value='${c.idCargo}'>${c.nombreCargo}</option>`;
    });
  };

  const cargarUsuarios = async () => {
    USUARIOS = await getUsuarios();
    selectUsuario.innerHTML = `<option value=''>Seleccione un usuario</option>`;
    USUARIOS.forEach(u => {
      selectUsuario.innerHTML += `<option value='${u.idUsuario}'>${u.correo}</option>`;
    });
  };

  const cargarDatos = async () => {
    DATA = await getEmpleados();
    pintarTabla(DATA);
  };

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    const filtrado = DATA.filter(e =>
      e.nombreEmpleado.toLowerCase().includes(val) ||
      e.apellidoEmpleado.toLowerCase().includes(val) ||
      e.Usuario.correo.toLowerCase().includes(val)
    );
    pintarTabla(filtrado);
  });

  btnNuevo.addEventListener("click", () => {
    form.reset();
    inputId.value = "";
    modal.show();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const empleado = {
      nombreEmpleado: inputNombre.value.trim(),
      apellidoEmpleado: inputApellido.value.trim(),
      telefonoEmpleado: inputTelefono.value.trim(),
      duiEmpleado: inputDui.value.trim(),
      nacimientoEmpleado: inputNacimiento.value,
      direccionEmpleado: inputDireccion.value.trim(),
      salarioEmpleado: parseFloat(inputSalario.value),
      idUsuario: selectUsuario.value,
      idCargo: selectCargo.value,
      idHotel: null
    };

    if (inputId.value) {
      await updateEmpleado(inputId.value, empleado);
      toast("success", "Empleado actualizado");
    } else {
      await createEmpleado(empleado);
      toast("success", "Empleado registrado");
    }
    modal.hide();
    cargarDatos();
  });

  cargarCargos();
  cargarUsuarios();
  cargarDatos();
});
