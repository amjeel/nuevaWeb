(() => {
  const API_BASE = "https://retoolapi.dev/jTx3Mf/Usuarios";

  // --- Cargar SweetAlert2 si no está disponible ---
  async function ensureSwal() {
    if (window.Swal) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ==== Utils ====
  const norm = s => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const toast = (icon = "success", title = "") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title,
      timer:1600, showConfirmButton:false, timerProgressBar:true });

  const defaultAvatar = () => "assets/images/user-avatar.jpg";

  const estadoBadge = (estado) => {
    const t = norm(estado);
    if (t.includes("act"))  return `<span class="status-badge available">Activo</span>`;
    if (t.includes("ina"))  return `<span class="status-badge occupied">Inactivo</span>`;
    return `<span class="status-badge other">${estado || "-"}</span>`;
  };

  const tagRol = (rol) => {
    const t = norm(rol);
    if (t.includes("admin"))         return "Administrador";
    if (t.includes("recep") || t.includes("front")) return "Recepcionista";
    if (t.includes("limp"))          return "Limpieza";
    if (t.includes("manten"))        return "Mantenimiento";
    return rol || "-";
  };

  // ==== API helpers ====
  const api = {
    async list(){ const r=await fetch(API_BASE); if(!r.ok) throw new Error("GET"); return r.json(); },
    async create(data){ const r=await fetch(API_BASE,{method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("POST"); return r.json(); },
    async patch(id,data){ const r=await fetch(`${API_BASE}/${id}`,{method:"PATCH",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("PATCH"); return r.json(); },
    async remove(id){ const r=await fetch(`${API_BASE}/${id}`,{method:"DELETE"}); if(!r.ok) throw new Error("DELETE"); return true; }
  };

  // ==== Mapeo flexible de campos (por si la colección tiene keys distintas) ====
  let MAP = null;
  function detectMap(rows){
    const keys = rows?.[0] ? Object.keys(rows[0]) : [];
    const f = (...preds)=> keys.find(k => preds.some(p => p(norm(k)))) || null;
    const by = {
      id: k => k==="id" || k.endsWith("_id"),
      nombre: k => k.includes("nombre") || k.includes("name") || k.includes("full"),
      email: k => k.includes("mail"),
      rol: k => k.includes("rol") || k.includes("role") || k.includes("cargo") || k.includes("tipo"),
      estado: k => k.includes("estado") || k.includes("active") || k.includes("status"),
      acceso: k => k.includes("ultimo") || k.includes("last") && (k.includes("acceso") || k.includes("access") || k.includes("login") || k.includes("seen") || k.includes("visit")),
      avatar: k => k.includes("avatar") || k.includes("foto") || k.includes("image") || k.includes("picture"),
      telefono: k => k.includes("tel") || k.includes("phone") || k.includes("cel")
    };
    return {
      id:       f(by.id)       || "id",
      nombre:   f(by.nombre)   || "nombre",
      email:    f(by.email)    || "email",
      rol:      f(by.rol)      || "rol",
      estado:   f(by.estado)   || "estado",
      acceso:   f(by.acceso)   || "ultimoAcceso",
      avatar:   f(by.avatar)   || "avatar",
      telefono: f(by.telefono) || "telefono"
    };
  }

  // ==== DOM refs (según tu HTML) ====
  const btnNuevo     = document.querySelector(".page-main-header .back-button");
  const searchInput  = document.querySelector(".table-actions .search-input");
  const filterSelect = document.querySelector(".table-actions .filter-select"); // roles
  const btnExport    = document.querySelector(".table-actions .btn-export");
  const tbody        = document.querySelector(".data-table tbody");

  // (OPCIONAL) estadísticas: si quieres actualizarlas dinámicamente, descomenta y usa updateStats()
  const statBoxes = {
    total:        document.querySelector('.stats-grid .stat-box:nth-child(1) p'),
    admins:       document.querySelector('.stats-grid .stat-box:nth-child(2) p'),
    recep:        document.querySelector('.stats-grid .stat-box:nth-child(3) p'),
    limpieza:     document.querySelector('.stats-grid .stat-box:nth-child(4) p'),
    mantenimiento:document.querySelector('.stats-grid .stat-box:nth-child(5) p'),
  };

  // ==== Render fila ====
  const renderRow = (r) => {
    const tr = document.createElement("tr");
    tr.dataset.id = r[MAP.id];

    const nombre = r[MAP.nombre] ?? "";
    const email = r[MAP.email] ?? "";
    const rol = tagRol(r[MAP.rol] ?? "");
    const estado = r[MAP.estado] ?? "Activo";
    const acceso = r[MAP.acceso] ?? "-";
    const avatar = r[MAP.avatar] || defaultAvatar();

    tr.innerHTML = `
      <td class="user-info"><img src="${avatar}" alt="User Avatar" class="user-avatar-small"> ${nombre}</td>
      <td>${email}</td>
      <td>${rol}</td>
      <td>${estadoBadge(estado)}</td>
      <td>${acceso}</td>
      <td>
        <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    return tr;
  };

  // ==== Estado local + carga ====
  let DATA = [];
  async function load(){
    tbody.innerHTML = "";
    try{
      const rows = await api.list();
      MAP = detectMap(rows);
      DATA = rows;
      DATA.forEach(r => tbody.appendChild(renderRow(r)));
      applyFilters();
      // updateStats(); // <- descomenta si quieres stats dinámicas
    }catch(e){
      console.error(e);
      await ensureSwal(); toast("error","Error cargando usuarios");
    }
  }

  // ==== Búsqueda y filtro ====
  function applyFilters(){
    const q = norm(searchInput?.value || "");
    const roleFilter = norm(filterSelect?.value || "");
    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const nombre = norm(tds[0]?.innerText || "");
      const rol    = norm(tds[2]?.innerText || "");
      const okQ = !q || nombre.includes(q) || (tds[1]?.innerText||"").toLowerCase().includes(q);
      const okR = !roleFilter || rol.includes(roleFilter);
      tr.style.display = (okQ && okR) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  // ==== Exportar CSV (respeta filtros activos) ====
  btnExport?.addEventListener("click", async ()=>{
    await ensureSwal();
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (!rows.length) return toast("info","No hay datos");
    const headers = ["Nombre Completo","Email","Rol","Estado","Último Acceso"];
    const csv = [headers.join(",")];
    rows.forEach(tr=>{
      if (tr.style.display === "none") return;
      const t = tr.querySelectorAll("td");
      csv.push([
        `"${(t[0].innerText || "").replace(/\s+/g," ").trim()}"`,
        (t[1].innerText || "").trim(),
        (t[2].innerText || "").trim(),
        `"${(t[3].innerText || "").trim()}"`,
        (t[4].innerText || "").trim()
      ].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`usuarios_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("success","CSV exportado");
  });

  // ==== File -> DataURL ====
  function fileToDataURL(file){
    return new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // ==== Modal (SweetAlert2) – mismo diseño moderno, campos de usuario ====
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact">
      <div class="avatar-col">
        <div class="avatar-preview">
          <img id="u-avatar-preview" src="${vals.avatar || defaultAvatar()}" alt="avatar">
        </div>
        <label class="upload-btn">
          <input id="u-avatar-file" type="file" accept="image/*" hidden>
          <i class="fas fa-image"></i> Subir foto
        </label>
      </div>

      <div class="fg">
        <label>Nombre Completo</label>
        <input id="u-nombre" class="input" placeholder="Nombre y Apellido" value="${vals.nombre ?? ""}">
      </div>
      <div class="fg">
        <label>Email</label>
        <input id="u-email" class="input" placeholder="correo@finder.com" value="${vals.email ?? ""}">
      </div>

      <div class="fg">
        <label>Rol</label>
        <select id="u-rol" class="input">
          <option ${tagRol(vals.rol)==="Administrador"?"selected":""}>Administrador</option>
          <option ${tagRol(vals.rol)==="Recepcionista"?"selected":""}>Recepcionista</option>
          <option ${tagRol(vals.rol)==="Limpieza"?"selected":""}>Limpieza</option>
          <option ${tagRol(vals.rol)==="Mantenimiento"?"selected":""}>Mantenimiento</option>
        </select>
      </div>
      <div class="fg">
        <label>Estado</label>
        <select id="u-estado" class="input">
          <option ${(!vals.estado || norm(vals.estado).includes("act"))?"selected":""}>Activo</option>
          <option ${norm(vals.estado).includes("ina")?"selected":""}>Inactivo</option>
        </select>
      </div>

      <div class="fg">
        <label>Teléfono (opcional)</label>
        <input id="u-tel" class="input" placeholder="+503 7777-0000" value="${vals.telefono ?? ""}">
      </div>
      <div class="fg">
        <label>Último Acceso</label>
        <input id="u-acceso" class="input" placeholder="23/07/2025 10:00" value="${vals.acceso ?? ""}">
      </div>

      <input id="u-avatar-data" type="hidden" value="${vals.avatar || ""}">
    </div>
  `;

  const readModal = () => {
    const nombre = document.getElementById("u-nombre").value.trim();
    const email = document.getElementById("u-email").value.trim();
    const rol = document.getElementById("u-rol").value.trim();
    const estado = document.getElementById("u-estado").value.trim();
    const telefono = document.getElementById("u-tel").value.trim();
    const acceso = document.getElementById("u-acceso").value.trim();
    const avatar = document.getElementById("u-avatar-data").value.trim();
    if (!nombre || !email){
      Swal.showValidationMessage("Completa al menos Nombre y Email");
      return false;
    }
    return { nombre, email, rol, estado, telefono, acceso, avatar };
  };

  function wireUpload(){
    const file = document.getElementById("u-avatar-file");
    const prev = document.getElementById("u-avatar-preview");
    const hid  = document.getElementById("u-avatar-data");
    if (!file || !prev || !hid) return;
    file.addEventListener("change", async (e)=>{
      const f = e.target.files?.[0];
      if (!f) return;
      try{
        const dataURL = await fileToDataURL(f);
        prev.src = dataURL; hid.value = dataURL;
      }catch(e){ console.error(e); toast("error","No se pudo leer la imagen"); }
    });
  }

  async function createDialog(){
    await ensureSwal();
    const { value } = await Swal.fire({
      title:"Nuevo Usuario",
      html: modalHtml(),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      didOpen: wireUpload,
      preConfirm: readModal
    });
    return value || null;
  }

  async function editDialog(current){
    await ensureSwal();
    const vals = {
      nombre: current[MAP.nombre], email: current[MAP.email],
      rol: current[MAP.rol], estado: current[MAP.estado],
      telefono: current[MAP.telefono], acceso: current[MAP.acceso],
      avatar: current[MAP.avatar]
    };
    const { value } = await Swal.fire({
      title:`Editar Usuario`,
      html: modalHtml(vals),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      didOpen: wireUpload,
      preConfirm: readModal
    });
    return value || null;
  }

  // ==== Crear ====
  btnNuevo?.addEventListener("click", async ()=>{
    const vals = await createDialog();
    if (!vals) return;
    const payload = {
      [MAP.nombre]: vals.nombre,
      [MAP.email]: vals.email,
      [MAP.rol]: vals.rol,
      [MAP.estado]: vals.estado,
      [MAP.telefono]: vals.telefono,
      [MAP.acceso]: vals.acceso,
      [MAP.avatar]: vals.avatar || ""
    };
    try{
      const created = await api.create(payload);
      DATA.push(created);
      tbody.appendChild(renderRow(created));
      applyFilters();
      // updateStats();
      toast("success","Usuario creado");
    }catch(e){ console.error(e); toast("error","No se pudo crear"); }
  });

  // ==== Acciones por fila ====
  tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button"); if (!btn) return;
    await ensureSwal();

    const tr = e.target.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    // Ver
    if (btn.classList.contains("btn-view")){
      const t = tr.querySelectorAll("td");
      await Swal.fire({
        title: t[0].innerText.replace(/\s+/g," ").trim(),
        html: `
          <div style="text-align:left">
            <p><b>Email:</b> ${t[1].textContent}</p>
            <p><b>Rol:</b> ${t[2].textContent}</p>
            <p><b>Estado:</b> ${t[3].textContent}</p>
            <p><b>Último acceso:</b> ${t[4].textContent}</p>
          </div>
        `,
        icon:"info"
      });
      return;
    }

    // Editar
    if (btn.classList.contains("edit")){
      const current = DATA.find(x => String(x[MAP.id]) === String(id));
      if (!current) return;
      const vals = await editDialog(current);
      if (!vals) return;
      try{
        const res = await api.patch(id, {
          [MAP.nombre]: vals.nombre,
          [MAP.email]: vals.email,
          [MAP.rol]: vals.rol,
          [MAP.estado]: vals.estado,
          [MAP.telefono]: vals.telefono,
          [MAP.acceso]: vals.acceso,
          [MAP.avatar]: vals.avatar || current[MAP.avatar] || ""
        });
        Object.assign(current, res);
        const newRow = renderRow(current);
        tr.replaceWith(newRow);
        applyFilters();
        // updateStats();
        toast("success","Usuario actualizado");
      }catch(e){ console.error(e); toast("error","No se pudo actualizar"); }
      return;
    }

    // Eliminar
    if (btn.classList.contains("delete")){
      const nombreTxt = tr.querySelector(".user-info")?.innerText.trim() || "el usuario";
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar usuario?",
        text:`Se eliminará ${nombreTxt}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        await api.remove(id);
        DATA = DATA.filter(x => String(x[MAP.id]) !== String(id));
        tr.remove();
        // updateStats();
        toast("success","Usuario eliminado");
      }catch(e){ console.error(e); toast("error","No se pudo eliminar"); }
    }
  });

  // ==== (Opcional) Estadísticas dinámicas por rol ====
  function updateStats(){
    if (!statBoxes.total) return; // si no existe la sección, se ignora
    const total = DATA.length;
    const count = (pred) => DATA.filter(pred).length;
    const is = (str) => (r) => norm(tagRol(r[MAP.rol]||"")).includes(str);

    statBoxes.total.textContent = total;
    statBoxes.admins.textContent = count(is("administrador"));
    statBoxes.recep.textContent = count(is("recepcionista"));
    statBoxes.limpieza.textContent = count(is("limpieza"));
    statBoxes.mantenimiento.textContent = count(is("mantenimiento"));
  }

  // ==== Init ====
  (async function init(){
    try{ await ensureSwal(); }catch(_){}
    load();
  })();
})();
