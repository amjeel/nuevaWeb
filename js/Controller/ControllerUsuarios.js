import {
  getUsuarios,
  createUsuarios,
  updateUsuarios,
  deleteUsuarios
} from "../Services/serviceUsuarios.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport    = document.querySelector(".btn-export");

  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_ROLES = `${API_URL}/consultarRoles`;

  let DATA = [];
  let ROLES = [];

  // ---------- Utils ----------
  const norm = (s) => (s ?? "").toString()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const toast = (icon="success", title="") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1600, showConfirmButton:false, timerProgressBar:true });

  const normalizeList = (json) => {
    if (Array.isArray(json)) return json;
    if (json?.content) return json.content;
    if (json?.data)    return json.data;
    if (json?.items)   return json.items;
    if (json?.results) return json.results;
    return [];
  };

  async function loadRoles(){
    try{
      const res = await fetch(ENDPOINT_ROLES);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      ROLES = normalizeList(await res.json());
    }catch(e){
      console.error("Error cargando Roles:", e);
      ROLES = [];
    }
  }

  const optionsRoles = (selectedId=null) =>
    ROLES.map(x => {
      const id   = x.idRol ?? x.id ?? "";
      const name = x.nombreRol ?? x.nameRoles ?? "";
      const sel  = String(id) === String(selectedId) ? "selected" : "";
      return `<option value="${id}" ${sel}>${name}</option>`;
    }).join("");

  // ---------- Render ----------
  const renderRow = (u) => {
    const id       = u.idUsuario ?? "";
    const nombre   = u.nombreUsuario ?? "-";
    const correo   = u.correoUsuario ?? "-";
    const rolName  = u.nombreRol ?? "-";
    const genero   = u.generoUsuario === "M" ? "Masculino" : (u.generoUsuario === "F" ? "Femenino" : "-");

    const tr = document.createElement("tr");
    tr.dataset.idUsuario = id;
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${correo}</td>
      <td>${rolName}</td>
      <td>${genero}</td>
      <td>
        <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  const renderTabla = (lista) => {
    tbody.innerHTML = "";
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="7">Actualmente no hay Usuarios</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };

  // ---------- Filtros ----------
  function applyFilters() {
    const q = norm(searchInput?.value || "");
    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const nombre    = norm(tds[0]?.textContent || "");
      const correo    = norm(tds[1]?.textContent || "");
      const rol       = norm(tds[2]?.textContent || "");
      const genero    = norm(tds[3]?.textContent || "");
      const campos = [nombre, correo, rol, genero];
      const okQ = !q || campos.some(txt => txt.includes(q));
      tr.style.display = okQ ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", applyFilters);

  // ---------- Modal ----------
  const inputStyle = `
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #c4c4c4;
    background-color: #fafafa;
    font-size: 14px;
    transition: border-color 0.2s ease;
  `;

  const modalHtml = (vals = {}, isEdit = false) => `
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;text-align:left;font-size:14px;">
  <div>
    <label><strong>Rol</strong></label>
    <select id="u-rol" class="input" style="${inputStyle}">
      <option value="">Seleccione...</option>
      ${optionsRoles(vals.idRol ?? "")}
    </select>
  </div>

  <div>
    <label><strong>Nombre de usuario</strong></label>
    <input id="u-nombre" class="input" type="text" placeholder="Ej: Juan Perez"
           value="${vals.nombreUsuario ?? ""}" style="${inputStyle}">
  </div>

  <div>
    <label><strong>Correo</strong></label>
    <input id="u-correo" class="input" type="email" placeholder="correo@example.com"
           value="${vals.correoUsuario ?? ""}" style="${inputStyle}">
  </div>

  ${!isEdit ? `
  <div>
    <label><strong>Contraseña</strong></label>
    <input id="u-pass" class="input" type="password" placeholder="Mínimo 8 caracteres"
           style="${inputStyle}">
  </div>

  <div>
    <label><strong>Respuesta de seguridad</strong></label>
    <input id="u-sec" class="input" type="text" placeholder="Respuesta secreta"
           value="${vals.segurityAnswerUsuario ?? ""}" style="${inputStyle}">
  </div>
  ` : ""}

  <div>
    <label><strong>Género</strong></label>
    <select id="u-genero" class="input" style="${inputStyle}">
      <option value="">Seleccione...</option>
      <option value="M" ${vals.generoUsuario === 'M' ? 'selected' : ''}>Masculino</option>
      <option value="F" ${vals.generoUsuario === 'F' ? 'selected' : ''}>Femenino</option>
    </select>
  </div>

  <div style="grid-column: span 2;">
    <label><strong>URL Imagen (opcional)</strong></label>
    <input id="u-img" class="input" type="text" placeholder="https://..."
           value="${vals.imagenUsuario ?? ""}" style="${inputStyle}">
  </div>
</div>`;

  const readModal = (isEdit = false, currentId = null) => {
    const rol    = document.getElementById("u-rol")?.value.trim();
    const nombre = document.getElementById("u-nombre")?.value.trim();
    const correo = document.getElementById("u-correo")?.value.trim();
    const genero = document.getElementById("u-genero")?.value;
    const img    = document.getElementById("u-img")?.value.trim();

    if (!rol || !nombre || !correo || !genero) {
      Swal.showValidationMessage("Completa todos los campos obligatorios.");
      return false;
    }

    // validar correo
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
      Swal.showValidationMessage("El correo debe ser un correo válido.");
      return false;
    }

    // validar duplicados
    const emailExiste = DATA.some(u => u.correoUsuario === correo && u.idUsuario !== currentId);
    if (emailExiste) {
      Swal.showValidationMessage("Ya existe un usuario con ese correo.");
      return false;
    }

    const nombreExiste = DATA.some(u => u.nombreUsuario === nombre && u.idUsuario !== currentId);
    if (nombreExiste) {
      Swal.showValidationMessage("Ya existe un usuario con ese nombre.");
      return false;
    }

    const payload = {
      idRol: rol,
      nombreUsuario: nombre,
      correoUsuario: correo,
      generoUsuario: genero,
      imagenUsuario: img || null
    };

    if (!isEdit) {
      const pass = document.getElementById("u-pass")?.value.trim();
      const sec  = document.getElementById("u-sec")?.value.trim();

      if (!pass || !sec) {
        Swal.showValidationMessage("Contraseña y respuesta de seguridad son obligatorias.");
        return false;
      }

      if (pass.length < 8) {
        Swal.showValidationMessage("La contraseña debe tener al menos 8 caracteres.");
        return false;
      }

      payload.contraseñaUsuario = pass;
      payload.segurityAnswerUsuario = sec;
    }

    return payload;
  };

  // ---------- Dialogs ----------
  async function createDialog(){
    const { value } = await Swal.fire({
      title:"Nuevo Usuario",
      html: modalHtml({}, false),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: () => readModal(false, null),
      didOpen: async () => {
        if (!ROLES.length) await loadRoles();
        const uSel = document.getElementById("u-rol");
        if (uSel) {
          uSel.innerHTML = `<option value="">Seleccione...</option>${optionsRoles()}`;
        }
      }
    });
    return value || null;
  }

  async function editDialog(current){
    const vals = {
      idRol: current.idRol ?? "",
      nombreUsuario: current.nombreUsuario ?? "",
      correoUsuario: current.correoUsuario ?? "",
      generoUsuario: current.generoUsuario ?? "",
      imagenUsuario: current.imagenUsuario ?? ""
    };

    const { value } = await Swal.fire({
      title: `Editar Usuario`,
      html: modalHtml(vals, true),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: () => readModal(true, current.idUsuario),
      didOpen: () => {
        const rolSel = document.getElementById("u-rol");
        const genSel = document.getElementById("u-genero");

        if (rolSel) rolSel.innerHTML = `<option value="">Seleccione...</option>${optionsRoles(vals.idRol)}`;
        if (genSel) genSel.value = vals.generoUsuario || "";
      }
    });

    if (!value) return null;
    return value;
  }

  // ---------- CRUD ----------
  async function loadUsuarios(){
    tbody.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try{
      const raw = await getUsuarios();
      DATA = normalizeList(raw);

      renderTabla(DATA);
      applyFilters();
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="5">Error al cargar Los Usuarios</td></tr>`;
      toast("error","Error cargando Usuarios");
    }
  }

  btnNueva?.addEventListener("click", async () => {
    try{
      const payload = await createDialog();
      if (!payload) return;
      await createUsuarios(payload);
      toast("success","Usuario creado");
      await loadUsuarios();
    }catch(e){
      console.error(e);
      toast("error","No se pudo crear");
    }
  });

  tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = e.target.closest("tr");
    const id = tr?.dataset.idUsuario;
    if (!id) return;

    if (btn.classList.contains("btn-view")){
      const t = tr.querySelectorAll("td");
      await Swal.fire({
        title: `Usuario ${t[0].textContent.trim()}`,
        html: `
          <div style="text-align:left">
            <p><b>Correo:</b> ${t[1].textContent}</p>
            <p><b>Rol:</b> ${t[2].textContent}</p>
            <p><b>Género:</b> ${t[3].textContent}</p>
          </div>
        `,
        icon:"info"
      });
      return;
    }

    if (btn.classList.contains("edit")){
      try{
        const current = DATA.find(x => String(x.idUsuario ?? x.id) === String(id));
        if (!current) return;
        const payload = await editDialog(current);
        if (!payload) return;

        await updateUsuarios(id, payload);
        toast("success","Usuario actualizado");
        await loadUsuarios();
      }catch(e){
        console.error(e);
        toast("error","No se pudo actualizar");
      }
      return;
    }

    if (btn.classList.contains("delete")){
      const numTxt = tr.querySelector("td")?.textContent.trim() || "el Usuario";
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar Usuario?",
        text:`Se eliminará ${numTxt}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        await deleteUsuarios(id);
        toast("success","Usuario eliminado");
        await loadUsuarios();
      }catch(e){
        console.error(e);
        toast("error","No se pudo eliminar");
      }
    }
  });

  // ---------- Init ----------
  Promise.all([loadUsuarios(), loadRoles()]);
});
