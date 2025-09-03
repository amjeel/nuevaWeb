(() => {
  const API_BASE = "https://retoolapi.dev/n7kExp/Habitaciones";

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

  // --- Utils ---
  const norm = s => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const toast = (icon = "success", title = "") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title,
      timer:1600, showConfirmButton:false, timerProgressBar:true });

  const money = (v) => {
    const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };

  const statusBadge = (estado) => {
    const t = norm(estado);
    if (t.includes("dispon")) return `<span class="status-badge available">Disponible</span>`;
    if (t.includes("ocupa"))  return `<span class="status-badge occupied">Ocupada</span>`;
    if (t.includes("limp"))   return `<span class="status-badge cleaning">Limpieza</span>`;
    if (t.includes("manten")) return `<span class="status-badge maintenance">Mantenimiento</span>`;
    return `<span class="status-badge other">${estado || "-"}</span>`;
  };

  const roomClassByEstado = (estado) => {
    const t = norm(estado);
    if (t.includes("dispon")) return "available";
    if (t.includes("ocupa"))  return "occupied";
    if (t.includes("limp"))   return "cleaning";
    if (t.includes("manten")) return "maintenance";
    return "other";
  };

  // --- API helpers ---
  const api = {
    async list(){ const r=await fetch(API_BASE); if(!r.ok) throw new Error("GET"); return r.json(); },
    async create(data){ const r=await fetch(API_BASE,{method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("POST"); return r.json(); },
    async patch(id,data){ const r=await fetch(`${API_BASE}/${id}`,{method:"PATCH",headers:{ "Content-Type":"application/json" },body:JSON.stringify(data)}); if(!r.ok) throw new Error("PATCH"); return r.json(); },
    async remove(id){ const r=await fetch(`${API_BASE}/${id}`,{method:"DELETE"}); if(!r.ok) throw new Error("DELETE"); return true; }
  };

  // --- Mapeo flexible (por si los nombres reales difieren) ---
  let MAP = null;
  function detectMap(rows){
    const keys = rows?.[0] ? Object.keys(rows[0]) : [];
    const f = (...preds)=> keys.find(k => preds.some(p => p(norm(k)))) || null;

    const by = {
      id:        k => k==="id" || k.endsWith("_id"),
      numero:    k => k.includes("num") || k.includes("habit") || k.includes("room"),
      tipo:      k => k.includes("tipo") || k.includes("type"),
      capacidad: k => k.includes("cap")  || k.includes("capa") || k.includes("guests"),
      precio:    k => k.includes("precio") || k.includes("price") || k.includes("rate"),
      estado:    k => k.includes("estado") || k.includes("status") || k.includes("disp"),
      salida:    k => (k.includes("salida") || k.includes("checkout") || k.includes("next")) && (k.includes("fecha") || k.includes("date")),
      desc:      k => k.startsWith("desc")
    };

    return {
      id:        f(by.id)        || "id",
      numero:    f(by.numero)    || "numero",
      tipo:      f(by.tipo)      || "tipo",
      capacidad: f(by.capacidad) || "capacidad",
      precio:    f(by.precio)    || "precio",
      estado:    f(by.estado)    || "estado",
      salida:    f(by.salida)    || "proximaSalida",
      desc:      f(by.desc)      || "descripcion"
    };
  }

  // --- DOM refs ---
  const btnNueva     = document.querySelector(".page-main-header .back-button"); // “Nueva Habitación”
  const searchInput  = document.querySelector(".table-actions .search-input");
  const filterSelect = document.querySelector(".table-actions .filter-select");
  const btnExport    = document.querySelector(".table-actions .btn-export");
  const tbody        = document.querySelector(".data-table tbody");

  // --- Render fila ---
  const renderRow = (r) => {
    const id = r[MAP.id];
    const estadoTxt = r[MAP.estado] ?? "";
    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.innerHTML = `
      <td class="room-number ${roomClassByEstado(estadoTxt)}">${r[MAP.numero] ?? ""}</td>
      <td>${r[MAP.tipo] ?? ""}</td>
      <td>${r[MAP.capacidad] ?? ""}</td>
      <td>$${money(r[MAP.precio])}</td>
      <td>${statusBadge(estadoTxt)}</td>
      <td>${r[MAP.salida] || "-"}</td>
      <td>
        <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  // --- Estado local + carga ---
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
      toast("error","Error cargando habitaciones");
    }
  }

  // --- Filtros / búsqueda ---
  function applyFilters(){
    const q = norm(searchInput?.value || "");
    const t = norm(filterSelect?.value || ""); // disponible/ocupada/limpieza/mantenimiento
    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const numero = norm(tds[0]?.textContent || "");
      const tipo   = norm(tds[1]?.textContent || "");
      const estado = norm(tds[4]?.textContent || "");
      const okQ = !q || numero.includes(q) || tipo.includes(q);
      const okT = !t || estado.includes(t);
      tr.style.display = (okQ && okT) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  // --- Exportar CSV ---
  btnExport?.addEventListener("click", ()=>{
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (!rows.length) return toast("info","No hay datos");
    const headers = ["Nº Habitación","Tipo","Capacidad","Precio/Noche","Estado","Próxima Salida"];
    const csv = [headers.join(",")];
    rows.forEach(tr=>{
      if (tr.style.display === "none") return;
      const t = tr.querySelectorAll("td");
      csv.push([
        t[0].textContent.trim(),
        t[1].textContent.trim(),
        t[2].textContent.trim(),
        t[3].textContent.trim().replace("$",""),
        `"${t[4].textContent.trim()}"`,
        t[5].textContent.trim()
      ].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`habitaciones_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("success","CSV exportado");
  });

  // --- Modal (SweetAlert2 compacto, mismo diseño; campos de habitaciones) ---
  // Diseño: 2 columnas compactas, inputs pequeños, redondeado; sin avatar.
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
      <div class="fg">
        <label>Nº Habitación</label>
        <input id="h-numero" class="input" placeholder="101" value="${vals.numero ?? ""}">
      </div>
      <div class="fg">
        <label>Tipo</label>
        <input id="h-tipo" class="input" placeholder="Simple / Doble / Suite" value="${vals.tipo ?? ""}">
      </div>

      <div class="fg">
        <label>Capacidad</label>
        <input id="h-cap" class="input" placeholder="2" value="${vals.capacidad ?? ""}">
      </div>
      <div class="fg">
        <label>Precio por noche</label>
        <input id="h-precio" class="input" placeholder="80.00" value="${vals.precio ?? ""}">
      </div>

      <div class="fg">
        <label>Estado</label>
        <select id="h-estado" class="input">
          <option ${vals.estado==="Disponible"?"selected":""}>Disponible</option>
          <option ${vals.estado==="Ocupada"?"selected":""}>Ocupada</option>
          <option ${vals.estado==="Limpieza"?"selected":""}>Limpieza</option>
          <option ${vals.estado==="Mantenimiento"?"selected":""}>Mantenimiento</option>
        </select>
      </div>
      <div class="fg">
        <label>Próxima salida (dd/mm/aaaa)</label>
        <input id="h-salida" class="input" placeholder="-" value="${vals.salida ?? ""}">
      </div>

      <div class="fg full">
        <label>Descripción (opcional)</label>
        <textarea id="h-desc" class="textarea" rows="3" placeholder="Notas…">${vals.desc ?? ""}</textarea>
      </div>
    </div>
  `;

  const readModal = () => {
    const numero = document.getElementById("h-numero").value.trim();
    const tipo = document.getElementById("h-tipo").value.trim();
    const capacidad = document.getElementById("h-cap").value.trim();
    const precio = document.getElementById("h-precio").value.trim();
    const estado = document.getElementById("h-estado").value.trim();
    const salida = document.getElementById("h-salida").value.trim();
    const desc = (document.getElementById("h-desc")?.value || "").trim();
    if (!numero || !tipo) {
      Swal.showValidationMessage("Completa Nº Habitación y Tipo");
      return false;
    }
    return { numero, tipo, capacidad, precio, estado, salida, desc };
  };

  async function createDialog(){
    const { value } = await Swal.fire({
      title:"Nueva Habitación",
      html: modalHtml(),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: readModal
    });
    return value || null;
  }

  async function editDialog(current){
    const vals = {
      numero: current[MAP.numero],
      tipo: current[MAP.tipo],
      capacidad: current[MAP.capacidad],
      precio: current[MAP.precio],
      estado: current[MAP.estado] || "Disponible",
      salida: current[MAP.salida],
      desc: current[MAP.desc]
    };
    const { value } = await Swal.fire({
      title:`Editar Habitación ${vals.numero || ""}`,
      html: modalHtml(vals),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: readModal
    });
    return value || null;
  }

  // --- Crear ---
  btnNueva?.addEventListener("click", async ()=>{
    await ensureSwal();
    const vals = await createDialog();
    if (!vals) return;
    const payload = {
      [MAP.numero]: vals.numero,
      [MAP.tipo]: vals.tipo,
      [MAP.capacidad]: vals.capacidad,
      [MAP.precio]: vals.precio,
      [MAP.estado]: vals.estado,
      [MAP.salida]: vals.salida,
      [MAP.desc]: vals.desc
    };
    try{
      const created = await api.create(payload);
      DATA.push(created);
      tbody.appendChild(renderRow(created));
      applyFilters();
      toast("success","Habitación creada");
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
        title: `Hab. ${t[0].textContent.trim()} • ${t[1].textContent.trim()}`,
        html: `
          <div style="text-align:left">
            <p><b>Capacidad:</b> ${t[2].textContent}</p>
            <p><b>Precio/Noche:</b> ${t[3].textContent}</p>
            <p><b>Estado:</b> ${t[4].textContent}</p>
            <p><b>Próxima salida:</b> ${t[5].textContent}</p>
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
          [MAP.numero]: vals.numero,
          [MAP.tipo]: vals.tipo,
          [MAP.capacidad]: vals.capacidad,
          [MAP.precio]: vals.precio,
          [MAP.estado]: vals.estado,
          [MAP.salida]: vals.salida,
          [MAP.desc]: vals.desc
        });
        Object.assign(current, res);
        const newRow = renderRow(current);
        tr.replaceWith(newRow);
        applyFilters();
        toast("success","Habitación actualizada");
      }catch(e){ console.error(e); toast("error","No se pudo actualizar"); }
      return;
    }

    // Eliminar
    if (btn.classList.contains("delete")){
      const numTxt = tr.querySelector("td")?.textContent.trim() || "la habitación";
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar habitación?",
        text:`Se eliminará ${numTxt}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        await api.remove(id);
        DATA = DATA.filter(x => String(x[MAP.id]) !== String(id));
        tr.remove();
        toast("success","Habitación eliminada");
      }catch(e){ console.error(e); toast("error","No se pudo eliminar"); }
    }
  });

  // --- Init ---
  (async function init(){
    try{ await ensureSwal(); }catch(_){}
    load();
  })();
})();
