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

  const norm = s => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const toast = (icon = "success", title = "") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title,
      timer:1600, showConfirmButton:false, timerProgressBar:true });

  const tagTipo = (tipo) => {
    const t = norm(tipo);
    if (t.includes("vip")) return `<span class="status-badge occupied">VIP</span>`;
    if (t.includes("nuev")) return `<span class="status-badge cleaning">Nuevo</span>`;
    if (t.includes("fre")) return `<span class="status-badge available">Frecuente</span>`;
    return `<span class="status-badge other">${tipo || "-"}</span>`;
  };

  const defaultAvatar = () => "assets/images/user-avatar.jpg";

  // --- API helpers ---
  const api = {
    async list(){ const r=await fetch(API_BASE); if(!r.ok) throw new Error("GET"); return r.json(); },
    async create(data){ const r=await fetch(API_BASE,{method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("POST"); return r.json(); },
    async patch(id,data){ const r=await fetch(`${API_BASE}/${id}`,{method:"PATCH",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("PATCH"); return r.json(); },
    async remove(id){ const r=await fetch(`${API_BASE}/${id}`,{method:"DELETE"}); if(!r.ok) throw new Error("DELETE"); return true; }
  };

  // --- Mapeo flexible de campos ---
  let MAP = null;
  function detectMap(rows){
    const keys = rows?.[0] ? Object.keys(rows[0]) : [];
    const f = (...preds)=> keys.find(k => preds.some(p => p(norm(k)))) || null;
    const by = {
      id: k => k==="id" || k.endsWith("_id"),
      nombre: k => k.includes("nombre") || k.includes("name") || k.includes("full"),
      email: k => k.includes("mail"),
      telefono: k => k.includes("tel") || k.includes("phone") || k.includes("cel"),
      ultima: k => (k.includes("ultima") || k.includes("last")) && (k.includes("reser") || k.includes("booking") || k.includes("date")),
      tipo: k => k.includes("tipo") || k.includes("segment") || k.includes("categoria") || k.includes("type"),
      avatar: k => k.includes("avatar") || k.includes("foto") || k.includes("image") || k.includes("picture")
    };
    return {
      id:       f(by.id)       || "id",
      nombre:   f(by.nombre)   || "nombre",
      email:    f(by.email)    || "email",
      telefono: f(by.telefono) || "telefono",
      ultima:   f(by.ultima)   || "ultimaReserva",
      tipo:     f(by.tipo)     || "tipo",
      avatar:   f(by.avatar)   || "avatar"
    };
  }

  // --- DOM refs ---
  const btnNuevo     = document.querySelector(".page-main-header .back-button");
  const searchInput  = document.querySelector(".table-actions .search-input");
  const filterSelect = document.querySelector(".table-actions .filter-select");
  const btnExport    = document.querySelector(".table-actions .btn-export");
  const tbody        = document.querySelector(".data-table tbody");

  // --- Render fila ---
  const renderRow = (r) => {
    const id = r[MAP.id];
    const nombre = r[MAP.nombre] ?? "";
    const email = r[MAP.email] ?? "";
    const tel = r[MAP.telefono] ?? "";
    const ult = r[MAP.ultima] ?? "-";
    const tipo = r[MAP.tipo] ?? "";
    const avatar = r[MAP.avatar] || defaultAvatar();

    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.innerHTML = `
      <td class="user-info"><img src="${avatar}" alt="Client Avatar" class="user-avatar-small"> ${nombre}</td>
      <td>${email}</td>
      <td>${tel}</td>
      <td>${ult}</td>
      <td>${tagTipo(tipo)}</td>
      <td>
        <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  // --- Estado local + carga inicial ---
  let DATA = [];
  async function load(){
    tbody.innerHTML = "";
    try{
      const rows = await api.list();
      MAP = detectMap(rows);
      DATA = rows;
      DATA.forEach(r => tbody.appendChild(renderRow(r)));
      applyFilters();
    }catch(e){
      console.error(e);
      toast("error","Error cargando clientes");
    }
  }

  // --- Filtros / búsqueda ---
  function applyFilters(){
    const q = norm(searchInput?.value || "");
    const t = norm(filterSelect?.value || "");
    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const nombre = norm(tds[0]?.innerText || "");
      const email  = norm(tds[1]?.innerText || "");
      const tipo   = norm(tds[4]?.innerText || "");
      const okQ = !q || nombre.includes(q) || email.includes(q);
      const okT = !t || tipo.includes(t);
      tr.style.display = (okQ && okT) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  // --- Exportar CSV ---
  btnExport?.addEventListener("click", ()=>{
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (!rows.length) return toast("info","No hay datos");
    const headers = ["Nombre Completo","Email","Teléfono","Última Reserva","Tipo de Cliente"];
    const csv = [headers.join(",")];
    rows.forEach(tr=>{
      if (tr.style.display === "none") return; // respeta filtro
      const t = tr.querySelectorAll("td");
      csv.push([
        `"${(t[0].innerText || "").replace(/\s+/g," ").trim()}"`,
        (t[1].innerText || "").trim(),
        (t[2].innerText || "").trim(),
        (t[3].innerText || "").trim(),
        `"${(t[4].innerText || "").trim()}"`
      ].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`clientes_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("success","CSV exportado");
  });

  // --- Util: leer archivo a DataURL (base64) ---
  function fileToDataURL(file){
    return new Promise((resolve, reject)=>{
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // --- Modal (SweetAlert2 compacto, SIN DNI, con upload de avatar) ---
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact">
      <div class="avatar-col">
        <div class="avatar-preview">
          <img id="c-avatar-preview" src="${vals.avatar || defaultAvatar()}" alt="avatar">
        </div>
        <label class="upload-btn">
          <input id="c-avatar-file" type="file" accept="image/*" hidden>
          <i class="fas fa-image"></i> Subir foto
        </label>
        <small class="hint">JPG/PNG • máx ~1–2MB</small>
      </div>

      <div class="fg">
        <label>Nombre Completo</label>
        <input id="c-nombre" class="input" placeholder="" value="${vals.nombre ?? ""}">
      </div>
      <div class="fg">
        <label>Email</label>
        <input id="c-email" class="input" placeholder="" value="${vals.email ?? ""}">
      </div>

      <div class="fg">
        <label>Teléfono</label>
        <input id="c-tel" class="input" placeholder="" value="${vals.telefono ?? ""}">
      </div>
      <div class="fg">
        <label>Última Reserva (dd/mm/aaaa)</label>
        <input id="c-ultima" class="input" placeholder="" value="${vals.ultima ?? ""}">
      </div>

      <div class="fg full">
        <label>Tipo de Cliente</label>
        <select id="c-tipo" class="input">
          <option ${vals.tipo==="Frecuente"?"selected":""}>Frecuente</option>
          <option ${vals.tipo==="Nuevo"?"selected":""}>Nuevo</option>
          <option ${vals.tipo==="VIP"?"selected":""}>VIP</option>
        </select>
      </div>

      <input id="c-avatar-data" type="hidden" value="${vals.avatar || ""}">
    </div>
  `;

  const readModal = () => {
    const nombre = document.getElementById("c-nombre").value.trim();
    const email = document.getElementById("c-email").value.trim();
    const telefono = document.getElementById("c-tel").value.trim();
    const ultima = document.getElementById("c-ultima").value.trim();
    const tipo = document.getElementById("c-tipo").value.trim();
    const avatar = document.getElementById("c-avatar-data").value.trim(); // dataURL o vacío
    if (!nombre || !email){
      Swal.showValidationMessage("Completa al menos Nombre y Email");
      return false;
    }
    return { nombre, email, telefono, ultima, tipo, avatar };
  };

  // Conecta listeners de upload al abrir
  function wireUploadHandlers(){
    const fileInput = document.getElementById("c-avatar-file");
    const preview = document.getElementById("c-avatar-preview");
    const hidden = document.getElementById("c-avatar-data");
    if (!fileInput || !preview || !hidden) return;

    fileInput.addEventListener("change", async (e)=>{
      const f = e.target.files?.[0];
      if (!f) return;
      try{
        const dataURL = await fileToDataURL(f);
        preview.src = dataURL;
        hidden.value = dataURL; // guardamos en el form
      }catch(err){
        console.error(err);
        toast("error","No se pudo leer la imagen");
      }
    });
  }

  async function createDialog(){
    const { value } = await Swal.fire({
      title:"Nuevo Cliente",
      html: modalHtml(),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      didOpen: wireUploadHandlers,
      preConfirm: readModal
    });
    return value || null;
  }

  async function editDialog(current){
    const vals = {
      nombre: current[MAP.nombre], email: current[MAP.email], telefono: current[MAP.telefono],
      ultima: current[MAP.ultima], tipo: current[MAP.tipo] || "Frecuente",
      avatar: current[MAP.avatar]
    };
    const { value } = await Swal.fire({
      title:"Editar Cliente",
      html: modalHtml(vals),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      didOpen: wireUploadHandlers,
      preConfirm: readModal
    });
    return value || null;
  }

  // --- Crear ---
  btnNuevo?.addEventListener("click", async ()=>{
    await ensureSwal();
    const vals = await createDialog();
    if (!vals) return;
    const payload = {
      [MAP.nombre]: vals.nombre, [MAP.email]: vals.email, [MAP.telefono]: vals.telefono,
      [MAP.ultima]: vals.ultima, [MAP.tipo]: vals.tipo, [MAP.avatar]: vals.avatar || ""
    };
    try{
      const created = await api.create(payload);
      DATA.push(created);
      tbody.appendChild(renderRow(created));
      applyFilters();
      toast("success","Cliente creado");
    }catch(e){ console.error(e); toast("error","No se pudo crear"); }
  });

  // --- Acciones por fila ---
  tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
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
            <p><b>Teléfono:</b> ${t[2].textContent}</p>
            <p><b>Última reserva:</b> ${t[3].textContent}</p>
            <p><b>Tipo:</b> ${t[4].textContent}</p>
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
          [MAP.nombre]: vals.nombre, [MAP.email]: vals.email, [MAP.telefono]: vals.telefono,
          [MAP.ultima]: vals.ultima, [MAP.tipo]: vals.tipo, [MAP.avatar]: vals.avatar || current[MAP.avatar] || ""
        });
        Object.assign(current, res);
        const newRow = renderRow(current);
        tr.replaceWith(newRow);
        applyFilters();
        toast("success","Cliente actualizado");
      }catch(e){ console.error(e); toast("error","No se pudo actualizar"); }
      return;
    }

    // Eliminar
    if (btn.classList.contains("delete")){
      const nombreTxt = tr.querySelector(".user-info")?.innerText.trim() || "el cliente";
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar cliente?",
        text:`Se eliminará ${nombreTxt}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        await api.remove(id);
        DATA = DATA.filter(x => String(x[MAP.id]) !== String(id));
        tr.remove();
        toast("success","Cliente eliminado");
      }catch(e){ console.error(e); toast("error","No se pudo eliminar"); }
    }
  });

  // --- Init ---
  (async function init(){
    try{ await ensureSwal(); }catch(_){}
    load();
  })();
})();
