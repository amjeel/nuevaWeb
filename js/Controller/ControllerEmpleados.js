// js/Controller/ControllerEmpleados.js
import {
  getEmpleados,
  createEmpleados,
  updateEmpleados,
  deleteEmpleados
} from "../Services/ServicesEmpleados.js";

document.addEventListener("DOMContentLoaded", async () => {
  /* ------------------ 1️⃣ Inyectar modal dinámicamente ------------------ */
  const modalHTML = `
  <div class="modal fade" id="EmpleadosModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content p-3">
        <div class="modal-header">
          <h5 class="modal-title">Registrar / Editar Empleado</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form id="empleadosForm" class="p-2">
          <input type="hidden" id="empleadosId">

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nombre</label>
              <input id="empleadosName" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Apellido</label>
              <input id="empleadosApellido" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Teléfono</label>
              <input id="empleadosTelefono" class="form-control">
            </div>
            <div class="col-md-6">
              <label class="form-label">DUI</label>
              <input id="empleadosDui" class="form-control">
            </div>
            <div class="col-md-6">
              <label class="form-label">Fecha de Nacimiento</label>
              <input type="date" id="empleadosNacimiento" class="form-control">
            </div>
            <div class="col-md-6">
              <label class="form-label">Dirección</label>
              <input id="empleadosDireccion" class="form-control">
            </div>
            <div class="col-md-6">
              <label class="form-label">Salario</label>
              <input type="number" id="empleadosSalario" class="form-control" step="0.01">
            </div>
            <div class="col-md-6">
              <label class="form-label">Cargo</label>
              <select id="empleadosCargo" class="form-select"></select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Usuario</label>
              <select id="empleadosUsuario" class="form-select"></select>
            </div>
          </div>

          <div class="mt-4 text-end">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  /* ------------------ 2️⃣ Bootstrap y elementos ------------------ */
  if (typeof window.bootstrap === "undefined" && typeof bootstrap !== "undefined") {
    window.bootstrap = bootstrap;
  }

  const modal = new bootstrap.Modal(document.getElementById("EmpleadosModal"));
  const form = document.getElementById("empleadosForm");
  const btnNuevo = document.getElementById("btn-abrir");
  const tbody = document.querySelector(".data-table tbody");

  // Inputs / selects
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

  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_CARGOS = `${API_URL}/consultarCargos`;
  const ENDPOINT_USUARIOS = `${API_URL}/consultarUsuarios`;

  /* ------------------ 3️⃣ Toast Helper ------------------ */
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

  const safe = (v, d = "—") => (v ?? v === 0 ? v : d);

  /* ------------------ 4️⃣ Render tabla ------------------ */
  const pintarTabla = (data) => {
    tbody.innerHTML = "";
    if (!data?.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Sin resultados</td></tr>`;
      return;
    }
    data.forEach((e) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${safe(e.nombreEmpleado)}</td>
        <td>${safe(e.apellidoEmpleado)}</td>
        <td>${safe(e.nombreCargo)}</td>
        <td>$${Number(e.salarioEmpleado || 0).toFixed(2)}</td>
        <td>
          <button class="btn-edit btn btn-sm btn-primary" data-id="${e.idEmpleado}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete btn btn-sm btn-danger" data-id="${e.idEmpleado}">
            <i class="fas fa-trash"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  };

  /* ------------------ 5️⃣ Cargar datos ------------------ */
  const cargarDatos = async () => {
    tbody.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;
    try {
      const data = await getEmpleados();
      pintarTabla(data);
    } catch {
      tbody.innerHTML = `<tr><td colspan="5">Error al cargar empleados</td></tr>`;
    }
  };

  /* ------------------ 6️⃣ Cargar catálogos (sin romper) ------------------ */
  const cargarCargos = async () => {
    try {
      const r = await fetch(ENDPOINT_CARGOS, {
        headers: { Accept: "application/json" },
        credentials: "include"
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      selectCargo.innerHTML = `<option value="">Seleccione un cargo</option>`;
      if (Array.isArray(data)) {
        data.forEach(c => {
          selectCargo.insertAdjacentHTML("beforeend", `<option value="${c.idCargo}">${c.nombreCargo}</option>`);
        });
      } else {
        console.warn("⚠️ No es un array, se ignora:", data);
      }
    } catch (err) {
      console.warn("No se pudieron cargar cargos:", err);
      selectCargo.innerHTML = `<option value="">Sin datos (error API)</option>`;
    }
  };

  const cargarUsuarios = async () => {
    try {
      const r = await fetch(ENDPOINT_USUARIOS, {
        headers: { Accept: "application/json" },
        credentials: "include"
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      selectUsuario.innerHTML = `<option value="">Seleccione un usuario</option>`;
      if (Array.isArray(data)) {
        data.forEach(u => {
          const nombre = u.nombreUsuario ?? u.correoUsuario ?? u.correo ?? "Usuario";
          selectUsuario.insertAdjacentHTML("beforeend", `<option value="${u.idUsuario}">${nombre}</option>`);
        });
      } else {
        console.warn("⚠️ No es un array, se ignora:", data);
      }
    } catch (err) {
      console.warn("No se pudieron cargar usuarios:", err);
      selectUsuario.innerHTML = `<option value="">Sin datos (error API)</option>`;
    }
  };

  /* ------------------ 7️⃣ Botón abrir modal (funciona siempre) ------------------ */
  btnNuevo?.addEventListener("click", async () => {
    try {
      await Promise.allSettled([cargarCargos(), cargarUsuarios()]);
    } finally {
      form.reset();
      inputId.value = "";
      modal.show();
    }
  });

  /* ------------------ 8️⃣ Guardar ------------------ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      idUsuario: selectUsuario.value || null,
      idCargo: selectCargo.value || null,
      idHotel: null,
      nombreEmpleado: inputNombre.value.trim(),
      apellidoEmpleado: inputApellido.value.trim(),
      direccionEmpleado: inputDireccion.value.trim(),
      nacimientoEmpleado: inputNacimiento.value,
      telefonoEmpleado: inputTelefono.value.trim(),
      salarioEmpleado: Number(inputSalario.value),
      duiEmpleado: inputDui.value.trim()
    };

    try {
      if (inputId.value) {
        await updateEmpleados(inputId.value, payload);
        toast("success", "Empleado actualizado");
      } else {
        await createEmpleados(payload);
        toast("success", "Empleado registrado");
      }
      modal.hide();
      cargarDatos();
    } catch {
      toast("error", "Error al guardar");
    }
  });

  /* ------------------ 9️⃣ Inicializar ------------------ */
  cargarDatos();
});
