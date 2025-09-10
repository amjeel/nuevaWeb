import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "../Services/ServicesUsuarios.js";

document.addEventListener("DOMContentLoaded", () => {
  const tablaUsuarios    = document.querySelector(".data-table tbody");
  const btnNuevoUsuario  = document.querySelector(".back-button");

  // --- Utils ---
  const norm = (s) => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizeList = (json) => {
    if (Array.isArray(json)) return json;
    if (json?.content) return json.content;
    if (json?.data)    return json.data;
    if (json?.items)   return json.items;
    if (json?.results) return json.results;
    return [];
  };
  const toast = (icon="success", title="") =>
    window.Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1500, showConfirmButton:false });

  // --- Modal (SweetAlert2) con los mismos campos de tu modal original ---
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left">
      <div class="fg full">
        <label>Nombre:</label>
        <input id="u-nombre" class="swal2-input" placeholder="Juan Pérez" value="${vals.nombre ?? ""}">
      </div>

      <div class="fg full">
        <label>Email:</label>
        <input id="u-email" class="swal2-input" type="email" placeholder="usuario@ejemplo.com" value="${vals.email ?? ""}">
      </div>

      <div class="fg">
        <label>Rol:</label>
        <select id="u-rol" class="swal2-select">
          <option value="">Seleccione...</option>
          <option value="administrador" ${vals.rol==="administrador"?"selected":""}>Administrador</option>
          <option value="recepcionista" ${vals.rol==="recepcionista"?"selected":""}>Recepcionista</option>
          <option value="limpieza"      ${vals.rol==="limpieza"?"selected":""}>Limpieza</option>
          <option value="mantenimiento" ${vals.rol==="mantenimiento"?"selected":""}>Mantenimiento</option>
        </select>
      </div>

      <div class="fg">
        <label>Estado:</label>
        <select id="u-estado" class="swal2-select">
          <option value="activo"   ${vals.estado==="activo"?"selected":""}>Activo</option>
          <option value="inactivo" ${vals.estado==="inactivo"?"selected":""}>Inactivo</option>
        </select>
      </div>
    </div>
  `;

  const leerModal = () => {
    const nombre = document.getElementById("u-nombre").value.trim();
    const email  = document.getElementById("u-email").value.trim();
    const rol    = document.getElementById("u-rol").value;
    const estado = document.getElementById("u-estado").value;

    if (!nombre || !email || !rol || !estado) {
      window.Swal.showValidationMessage("Completa todos los campos.");
      return false;
    }
    // validación simple de email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      window.Swal.showValidationMessage("El email no es válido.");
      return false;
    }

    // payload con las mismas claves que estabas usando
    return {
      nombreUsuario: nombre,
      correoUsuario: email,
      rol: rol,
      estado: estado  // "activo" | "inactivo"
    };
  };

  async function dialogCrear() {
    const { value } = await window.Swal.fire({
      title: "Nuevo Usuario",
      html: modalHtml({}),
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: "Guardar", cancelButtonText: "Cancelar",
      preConfirm: leerModal
    });
    return value || null;
  }

  async function dialogEditar(actual) {
    const vals = {
      nombre: actual.nombreUsuario ?? actual.nombre ?? "",
      email:  actual.correoUsuario ?? actual.email ?? "",
      rol:    (actual.rol ?? "").toString().toLowerCase(),
      estado: (actual.estado ?? "activo").toString().toLowerCase()
    };
    const { value } = await window.Swal.fire({
      title: "Editar Usuario",
      html: modalHtml(vals),
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: "Guardar", cancelButtonText: "Cancelar",
      preConfirm: leerModal
    });
    return value || null;
  }

  // --- Render de tabla (incluye Nombre Completo como primera columna) ---
  function renderUsuarios(lista) {
    tablaUsuarios.innerHTML = "";
    if (!Array.isArray(lista) || lista.length === 0) {
      tablaUsuarios.innerHTML = '<tr><td colspan="6">Actualmente no hay usuarios</td></tr>';
      return;
    }

    lista.forEach((u) => {
      const id     = u.idUsuario ?? u.id ?? "";
      const nombre = u.nombreUsuario ?? u.nombre ?? "";
      const correo = u.correoUsuario ?? u.email ?? "";
      const rol    = (u.rol ?? "").toString().toLowerCase();
      const estado = (u.estado ?? "activo").toString().toLowerCase();
      const last   = u.ultimoAcceso ?? "N/A";

      const estadoBadge =
        estado === "activo"
          ? `<span class="status-badge available">Activo</span>`
          : `<span class="status-badge occupied">Inactivo</span>`;

      const fila = `
        <tr>
          <td>${nombre}</td>
          <td>${correo}</td>
          <td>${rol}</td>
          <td>${estadoBadge}</td>
          <td>${last}</td>
          <td>
            <button class="btn-action btn-view"  data-id-usuario="${id}" title="Ver"><i class="fas fa-eye"></i></button>
            <button class="btn-action edit"      data-id-usuario="${id}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete"    data-id-usuario="${id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>
      `;
      tablaUsuarios.insertAdjacentHTML("beforeend", fila);
    });
  }

  // --- Cargar usuarios ---
  async function cargarUsuarios() {
    try {
      const data  = await getUsuarios();
      const lista = normalizeList(data);
      renderUsuarios(lista);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      tablaUsuarios.innerHTML = '<tr><td colspan="6">Error al cargar los usuarios</td></tr>';
    }
  }

  // --- Crear ---
  btnNuevoUsuario?.addEventListener("click", async () => {
    const payload = await dialogCrear();
    if (!payload) return;
    try {
      await createUsuario(payload);
      toast("success", "Usuario creado");
      await cargarUsuarios();
    } catch (e) {
      console.error(e);
      toast("error", "No se pudo crear");
    }
  });

  // --- Editar / Eliminar / Ver ---
  tablaUsuarios.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.idUsuario; // ← usa el data-id-usuario del botón
    if (!id) return;

    // Ver
    if (btn.classList.contains("btn-view")) {
      const row = btn.closest("tr").querySelectorAll("td");
      await window.Swal.fire({
        title: row[0].textContent.trim(), // Nombre
        html: `
          <div style="text-align:left">
            <p><b>Email:</b> ${row[1].textContent}</p>
            <p><b>Rol:</b> ${row[2].textContent}</p>
            <p><b>Estado:</b> ${row[3].textContent}</p>
            <p><b>Último acceso:</b> ${row[4].textContent}</p>
          </div>
        `,
        icon: "info"
      });
      return;
    }

    // Editar
    if (btn.classList.contains("edit")) {
      try {
        const data  = await getUsuarios();
        const lista = normalizeList(data);
        const u = lista.find(x => String(x.idUsuario ?? x.id ?? "") === String(id));
        if (!u) return;

        const payload = await dialogEditar(u);
        if (!payload) return;

        await updateUsuario(id, payload);
        toast("success", "Usuario actualizado");
        await cargarUsuarios();
      } catch (err) {
        console.error("Error al actualizar:", err);
        toast("error", "No se pudo actualizar");
      }
      return;
    }

    // Eliminar
    if (btn.classList.contains("delete")) {
      const { isConfirmed } = await window.Swal.fire({
        title: "¿Eliminar usuario?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning", showCancelButton: true,
        confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar"
      });
      if (!isConfirmed) return;

      try {
        await deleteUsuario(id);
        toast("success", "Usuario eliminado");
        await cargarUsuarios();
      } catch (err) {
        console.error("Error al eliminar:", err);
        toast("error", "No se pudo eliminar");
      }
    }
  });

  // Init
  cargarUsuarios();
});