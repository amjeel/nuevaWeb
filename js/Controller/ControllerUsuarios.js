// ControllerUsuarios.js
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "../Services/ServicesUsuarios.js";

document.addEventListener("DOMContentLoaded", () => {
  const tablaUsuarios = document.querySelector(".data-table tbody");
  const btnNuevoUsuario = document.querySelector(".back-button");

  // --- Modal dinámico ---
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3 id="modal-title">Nuevo Usuario</h3>
      <form id="usuarioForm">
        <input type="hidden" id="id">

        <label for="nombre">Nombre:</label>
        <input type="text" id="nombre" required>

        <label for="email">Email:</label>
        <input type="email" id="email" required>

        <label for="rol">Rol:</label>
        <select id="rol" required>
          <option value="administrador">Administrador</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="limpieza">Limpieza</option>
          <option value="mantenimiento">Mantenimiento</option>
        </select>

        <label for="estado">Estado:</label>
        <select id="estado" required>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <button type="submit" class="btn-save">Guardar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const usuarioForm = modal.querySelector("#usuarioForm");
  const closeModalBtn = modal.querySelector(".close");

  // Helpers
  const abrirModalNuevo = () => {
    document.getElementById("modal-title").innerText = "Nuevo Usuario";
    usuarioForm.reset();
    usuarioForm.querySelector("#id").value = "";
    modal.style.display = "block";
  };
  const cerrarModal = () => (modal.style.display = "none");
  const $ = (sel) => usuarioForm.querySelector(sel);

  // Abrir/Cerrar modal
  btnNuevoUsuario?.addEventListener("click", abrirModalNuevo);
  closeModalBtn?.addEventListener("click", cerrarModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });

  // Render tabla
  function renderUsuarios(lista) {
    tablaUsuarios.innerHTML = "";
    if (!Array.isArray(lista) || lista.length === 0) {
      tablaUsuarios.innerHTML = '<tr><td colspan="6">Actualmente no hay usuarios</td></tr>';
      return;
    }

    lista.forEach((u) => {
      // Campos según tu DTO:
      const id = u.id ?? u.id ?? "";
      const nombre = u.nombreUsuario ?? u.nombre ?? "";
      const correo = u.correoUsuario ?? u.email ?? "";
      const rol = u.rol ?? "";
      const estado = (u.estado ?? "activo").toString().toLowerCase();
      const last = u.ultimoAcceso ?? "N/A";

      const estadoBadge =
        estado === "activo"
          ? `<span class="status-badge available">Activo</span>`
          : `<span class="status-badge occupied">Inactivo</span>`;

      const fila = `
        <tr>
          <td>${correo}</td>
          <td>${rol}</td>
          <td>${estadoBadge}</td>
          <td>${last}</td>
          <td>
            <button class="btn-action btn-view" data-id-usuario="${id}"><i class="fas fa-eye"></i></button>
            <button class="btn-action edit"     data-id-usuario="${id}"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete"   data-id-usuario="${id}"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>
      `;
      tablaUsuarios.insertAdjacentHTML("beforeend", fila);
    });
  }

  // Cargar usuarios
  async function cargarUsuarios() {
    try {
      const data = await getUsuarios();
      const lista = Array.isArray(data)
        ? data
        : (data?.content || data?.data || data?.items || data?.results || []);
      renderUsuarios(lista);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      tablaUsuarios.innerHTML = '<tr><td colspan="6">Error al cargar los usuarios</td></tr>';
    }
  }

  // Guardar (crear/actualizar)
  usuarioForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Leer SIEMPRE desde el form (evita null)
    const payload = {
      // inputs son #nombre y #email, pero tu backend espera nombreUsuario/correoUsuario
      nombreUsuario: $("#nombre")?.value.trim() ?? "",
      correoUsuario: $("#email")?.value.trim() ?? "",
      rol: $("#rol")?.value ?? "recepcionista",
      estado: $("#estado")?.value ?? "activo",
    };

    const id = $("#id")?.value;

    try {
      if (id) {
        await updateUsuario(id, payload);
      } else {
        await createUsuario(payload);
      }
      cerrarModal();
      await cargarUsuarios();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert("No se pudo guardar el usuario.");
    }
  });

  // Editar / Eliminar
  tablaUsuarios.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    // Editar
    if (btn.classList.contains("edit")) {
      try {
        const data = await getUsuarios();
        const lista = Array.isArray(data)
          ? data
          : (data?.content || data?.data || data?.items || data?.results || []);
        const u = lista.find(
          (x) => String(x.id ?? x.id ?? "") === String(id)
        );
        if (!u) return;

        document.getElementById("modal-title").innerText = "Editar Usuario";
        $("#id").value = u.id ?? u.id ?? "";
        $("#nombre").value = u.nombreUsuario ?? u.nombre ?? "";
        $("#email").value = u.correoUsuario ?? u.email ?? "";
        $("#rol").value = u.rol ?? "recepcionista";
        $("#estado").value = (u.estado ?? "activo").toString().toLowerCase();

        modal.style.display = "block";
      } catch (err) {
        console.error("Error al preparar edición:", err);
      }
      return;
    }

    // Eliminar
    if (btn.classList.contains("delete")) {
      if (confirm("¿Seguro que deseas eliminar este usuario?")) {
        try {
          await deleteUsuario(id);
          await cargarUsuarios();
        } catch (error) {
          console.error("Error eliminando usuario:", error);
          alert("No se pudo eliminar el usuario.");
        }
      }
      return;
    }

    // Ver (placeholder)
    if (btn.classList.contains("btn-view")) {
      console.log("Ver usuario:", id);
    }
  });

  // Init
  cargarUsuarios();
});
