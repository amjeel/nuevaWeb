// === Config ===
const API_BASE = "https://retoolapi.dev/IfZls2/Mantenimientos"; // REST mock

document.addEventListener("DOMContentLoaded", () => {
  // ====== SweetAlert loader (por si no está) ======
  async function ensureSwal(){
    if (window.Swal) return;
    await new Promise((resolve, reject)=>{
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ===== SweetAlert: helpers =====
  const swalToast = (icon = "success", title = "") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title, showConfirmButton:false, timer:1600, timerProgressBar:true });

  const swalConfirm = async (title, text) => {
    const { isConfirmed } = await Swal.fire({
      title, text, icon:"question", showCancelButton:true,
      confirmButtonText:"Sí, continuar", cancelButtonText:"Cancelar"
    });
    return isConfirmed;
  };

  const swalInput = async ({ title, input="text", inputValue="", placeholder="", validate=true }) => {
    const { value } = await Swal.fire({
      title, input, inputValue, inputPlaceholder:placeholder,
      showCancelButton:true, cancelButtonText:"Cancelar", confirmButtonText:"Guardar",
      preConfirm:(v)=>{ if(validate && (!v || !String(v).trim())){ Swal.showValidationMessage("Este campo es obligatorio"); return false; } return String(v).trim(); }
    });
    return value ?? null;
  };

  // ===== Partes de la pantalla =====
  const sections = document.querySelectorAll(".section-card");
  const pendingSection = sections[0];
  const historySection  = sections[1];

  // Pendientes
  const tbPend = pendingSection.querySelector("tbody");
  const searchPend = pendingSection.querySelector(".search-input");
  const selectPriority = pendingSection.querySelector(".filter-select");
  const btnActualizar =  Array.from(pendingSection.querySelectorAll("button"))
    .find(b => (b.textContent || "").toLowerCase().includes("actualizar"));
  const btnNueva = document.querySelector(".page-main-header .back-button");

  // Historial
  const tbHist = historySection.querySelector("tbody");
  const searchHist = historySection.querySelector(".search-input");
  const dateFilter = historySection.querySelector(".date-filter");
  const btnExportar = Array.from(historySection.querySelectorAll("button"))
    .find(b => (b.textContent || "").toLowerCase().includes("exportar"));

  // ==== Utiles ====
  const fmtToday = () => {
    const d = new Date(); const dd=String(d.getDate()).padStart(2,"0");
    const mm=String(d.getMonth()+1).padStart(2,"0"); const yyyy=d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const normaliza = (str) => (str||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

  const getPriorityText = (badgeEl) => {
    if (!badgeEl) return "";
    if (badgeEl.classList.contains("high")) return "alta";
    if (badgeEl.classList.contains("medium")) return "media";
    if (badgeEl.classList.contains("low")) return "baja";
    return badgeEl.textContent.trim().toLowerCase();
  };
  const setPriorityClass = (badgeEl, prioridad) => {
    badgeEl.classList.remove("high","medium","low");
    const p = (prioridad||"").toLowerCase();
    if (p==="alta"){ badgeEl.classList.add("high"); badgeEl.textContent="Alta"; }
    else if (p==="media"){ badgeEl.classList.add("medium"); badgeEl.textContent="Media"; }
    else { badgeEl.classList.add("low"); badgeEl.textContent="Baja"; }
  };

  // === API helpers ===
  const api = {
    async listAll() {
      const r = await fetch(API_BASE);
      if (!r.ok) throw new Error("Error cargando datos");
      return r.json();
    },
    async create(data) {
      const r = await fetch(API_BASE, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error("No se pudo crear");
      return r.json();
    },
    async patch(id, data) {
      const r = await fetch(`${API_BASE}/${id}`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error("No se pudo actualizar");
      return r.json();
    },
    async remove(id) {
      const r = await fetch(`${API_BASE}/${id}`, { method:"DELETE" });
      if (!r.ok) throw new Error("No se pudo eliminar");
      return true;
    }
  };

  // === Render helpers ===
  const renderPendRow = (item) => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id; // id REAL de la API
    tr.innerHTML = `
      <td>${item.codigo || `#T${String(item.id).padStart(3,"0")}`}</td>
      <td>${item.habitacion || ""}</td>
      <td>${item.descripcion || ""}</td>
      <td><span class="priority-badge"></span></td>
      <td class="user-info"><img src="img/Soto.png" alt="Staff" class="user-avatar-small"> ${item.asignado || "Roberto Soto"}</td>
      <td>${item.fecha || fmtToday()}</td>
      <td>
        <button class="btn-action primary"><i class="fas fa-check"></i> Completar</button>
        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    setPriorityClass(tr.querySelector(".priority-badge"), item.prioridad || "Media");
    return tr;
  };

  const renderHistRow = (item) => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${item.codigo || `#T${String(item.id).padStart(3,"0")}`}</td>
      <td>${item.habitacion || ""}</td>
      <td>${item.descripcion || ""}</td>
      <td>${item.completadoFecha || fmtToday()}</td>
      <td class="user-info"><img src="img/Soto.png" alt="Staff" class="user-avatar-small"> ${item.asignado || "Roberto Soto"}</td>
    `;
    return tr;
  };

  // === Carga inicial ===
  async function loadData() {
    tbPend.innerHTML = "";
    tbHist.innerHTML = "";
    try {
      const all = await api.listAll();
      // Convención de campos esperados:
      // { id, codigo, habitacion, descripcion, prioridad, asignado, fecha, estado, completadoFecha }
      const pend = all.filter(x => (x.estado || "Pendiente").toLowerCase() !== "completado");
      const hist = all.filter(x => (x.estado || "").toLowerCase() === "completado");

      pend.forEach(it => tbPend.appendChild(renderPendRow(it)));
      hist.sort((a,b)=> (b.id||0)-(a.id||0)).forEach(it => tbHist.appendChild(renderHistRow(it)));
      filtraPendientes(); filtraHistorial();
    } catch (e) {
      swalToast("error","Error cargando datos");
      console.error(e);
    }
  }

  // === ID helper para el campo visual "codigo" ===
  const getNextCodigo = () => {
    const nums = Array.from(tbPend.querySelectorAll("tr"))
      .map(tr => tr.querySelector("td")?.textContent.trim())
      .filter(Boolean)
      .map(idtxt => parseInt(String(idtxt).replace(/[^0-9]/g,""),10))
      .filter(n=>!Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `#T${String(max+1).padStart(3,"0")}`;
  };

  // === Modal SweetAlert2 (compacto) para CREAR ===
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact">
      <div class="fg">
        <label>ID Tarea (código visual)</label>
        <input id="m-codigo" class="input" value="${vals.codigo ?? getNextCodigo()}" placeholder="#T001">
      </div>
      <div class="fg">
        <label>Habitación</label>
        <input id="m-hab" class="input" value="${vals.habitacion ?? ""}" placeholder="101">
      </div>

      <div class="fg full">
        <label>Descripción</label>
        <textarea id="m-desc" class="textarea" rows="3" placeholder="">${vals.descripcion ?? ""}</textarea>
      </div>

      <div class="fg">
        <label>Prioridad</label>
        <select id="m-pri" class="input">
          <option ${vals.prioridad==="Alta"?"selected":""}>Alta</option>
          <option ${!vals.prioridad || vals.prioridad==="Media"?"selected":""}>Media</option>
          <option ${vals.prioridad==="Baja"?"selected":""}>Baja</option>
        </select>
      </div>
      <div class="fg">
        <label>Asignado a</label>
        <input id="m-asig" class="input" value="${vals.asignado ?? "Roberto Soto"}" placeholder="Nombre del técnico">
      </div>

      <div class="fg">
        <label>Fecha solicitud (dd/mm/aaaa)</label>
        <input id="m-fecha" class="input" value="${vals.fecha ?? fmtToday()}" placeholder="${fmtToday()}">
      </div>
      <div class="fg">
        <label>Estado</label>
        <select id="m-estado" class="input">
          <option ${!vals.estado || vals.estado==="Pendiente"?"selected":""}>Pendiente</option>
          <option ${vals.estado==="Completado"?"selected":""}>Completado</option>
        </select>
      </div>
    </div>
  `;

  const readModal = () => {
    const codigo = document.getElementById("m-codigo").value.trim();
    const habitacion = document.getElementById("m-hab").value.trim();
    const descripcion = document.getElementById("m-desc").value.trim();
    const prioridad = document.getElementById("m-pri").value.trim();
    const asignado = document.getElementById("m-asig").value.trim();
    const fecha = document.getElementById("m-fecha").value.trim();
    const estado = document.getElementById("m-estado").value.trim();
    if (!codigo || !habitacion || !descripcion){
      Swal.showValidationMessage("Completa Código, Habitación y Descripción");
      return false;
    }
    return { codigo, habitacion, descripcion, prioridad, asignado, fecha, estado };
  };

  async function createDialog(){
    await ensureSwal();
    const { value } = await Swal.fire({
      title:"Nueva Solicitud de Mantenimiento",
      html: modalHtml(),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: readModal
    });
    return value || null;
  }

  // === Crear (POST) con SweetAlert2 ===
  btnNueva?.addEventListener("click", async () => {
    const vals = await createDialog();
    if (!vals) return;

    const payload = {
      codigo: vals.codigo,
      habitacion: vals.habitacion,
      descripcion: vals.descripcion,
      prioridad: vals.prioridad,
      asignado: vals.asignado || "Roberto Soto",
      fecha: vals.fecha || fmtToday(),
      estado: vals.estado || "Pendiente",
      completadoFecha: vals.estado==="Completado" ? fmtToday() : ""
    };
    try {
      const created = await api.create(payload);
      if ((created.estado || "Pendiente").toLowerCase() === "completado"){
        tbHist.prepend(renderHistRow(created));
      } else {
        tbPend.appendChild(renderPendRow(created));
      }
      swalToast("success","Nueva solicitud creada");
    } catch (e) {
      swalToast("error","No se pudo crear");
      console.error(e);
    }
  });

  // === Filtros pendientes ===
  function filtraPendientes() {
    const q = normaliza(searchPend.value);
    const prioridadFiltro = (selectPriority.value || "").toLowerCase();
    Array.from(tbPend.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const hab = normaliza(tds[1]?.textContent);
      const desc = normaliza(tds[2]?.textContent);
      const pr = getPriorityText(tr.querySelector(".priority-badge"));
      const okTexto = q === "" || hab.includes(q) || desc.includes(q);
      const okPri = prioridadFiltro === "" || pr === prioridadFiltro;
      tr.style.display = (okTexto && okPri) ? "" : "none";
    });
  }
  searchPend?.addEventListener("input", filtraPendientes);
  selectPriority?.addEventListener("change", filtraPendientes);

  // === Actualizar (refrescar de la API) ===
  btnActualizar?.addEventListener("click", async () => {
    await loadData();
    swalToast("info","Tareas actualizadas");
  });

  // === Acciones por fila pendientes ===
  tbPend.addEventListener("click", async (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const tr = e.target.closest("tr"); if (!tr) return;
    const apiId = tr.dataset.id; // id real de la API
    const tds = tr.querySelectorAll("td");
    const codigoTxt = tds[0].textContent.trim();

    // Completar
    if (btn.classList.contains("primary")) {
      const ok = await swalConfirm("¿Marcar como completada?", `Se moverá la tarea ${codigoTxt} al historial.`);
      if (!ok) return;
      try {
        const patch = await api.patch(apiId, { estado:"Completado", completadoFecha: fmtToday() });
        const histRow = renderHistRow({
          ...patch,
          codigo: tds[0].textContent,
          habitacion: tds[1].textContent,
          descripcion: tds[2].textContent,
          asignado: tds[4].innerText
        });
        tbHist.prepend(histRow);
        tr.remove();
        swalToast("success", `Tarea ${codigoTxt} completada`);
      } catch (err) {
        swalToast("error","No se pudo completar");
        console.error(err);
      }
      return;
    }

    // Editar (usa prompts SweetAlert existentes)
    if (btn.classList.contains("edit")) {
      const descTd = tds[2];
      const badge = tr.querySelector(".priority-badge");

      // Editar descripción
      const nuevaDesc = await swalInput({
        title:"Editar descripción",
        input:"textarea",
        inputValue: descTd.textContent.trim(),
        placeholder:"Descripción...",
        validate:true
      });
      if (nuevaDesc === null) return;

      // Editar prioridad
      const currentPri = (getPriorityText(badge) || "media").replace(/^\w/, c=>c.toUpperCase());
      const { value: nuevaPri } = await Swal.fire({
        title:"Editar prioridad",
        input:"select",
        inputOptions:{ "Alta":"Alta", "Media":"Media", "Baja":"Baja" },
        inputValue: currentPri,
        showCancelButton:true, cancelButtonText:"Cancelar", confirmButtonText:"Guardar"
      });
      if (!nuevaPri) return;

      try {
        const patched = await api.patch(apiId, { descripcion:nuevaDesc, prioridad:nuevaPri });
        descTd.textContent = patched.descripcion || nuevaDesc;
        setPriorityClass(badge, patched.prioridad || nuevaPri);
        swalToast("success","Tarea actualizada");
      } catch (err) {
        swalToast("error","No se pudo actualizar");
        console.error(err);
      }
    }

    // Eliminar
    if (btn.classList.contains("delete")) {
      const ok = await swalConfirm("¿Eliminar solicitud?", `Se eliminará la tarea ${codigoTxt}.`);
      if (!ok) return;
      try{
        await api.remove(apiId);
        tr.remove();
        swalToast("success","Tarea eliminada");
      }catch(err){
        console.error(err);
        swalToast("error","No se pudo eliminar");
      }
    }
  });

  // === Filtros historial ===
  function filtraHistorial() {
    const q = normaliza(searchHist.value);
    const dateVal = dateFilter.value;
    Array.from(tbHist.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const hab = normaliza(tds[1]?.textContent);
      const desc = normaliza(tds[2]?.textContent);
      const fechaTxt = (tds[3]?.textContent || "").trim(); // dd/mm/yyyy
      let okFecha = true;
      if (dateVal) {
        const [y,m,d] = dateVal.split("-");
        const buscada = `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
        okFecha = fechaTxt === buscada;
      }
      const okTexto = q === "" || hab.includes(q) || desc.includes(q);
      tr.style.display = (okTexto && okFecha) ? "" : "none";
    });
  }
  searchHist?.addEventListener("input", filtraHistorial);
  dateFilter?.addEventListener("change", filtraHistorial);

  // === Exportar historial (desde DOM actual) ===
  btnExportar?.addEventListener("click", () => {
    const rows = Array.from(tbHist.querySelectorAll("tr"));
    if (!rows.length) { swalToast("info","No hay datos en el historial"); return; }
    const headers = ["ID Tarea","Habitación","Descripción","Fecha Completado","Realizado por"];
    const csv = [headers.join(",")];
    rows.forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const id = (tds[0]?.textContent || "").trim();
      const hab = (tds[1]?.textContent || "").trim();
      const desc = (tds[2]?.textContent || "").trim().replaceAll('"','""');
      const fecha = (tds[3]?.textContent || "").trim();
      const real = (tds[4]?.textContent || "").trim();
      csv.push([id,hab,`"${desc}"`,fecha,`"${real}"`].join(","));
    });
    const blob = new Blob([csv.join("\n")],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`historial_mantenimiento_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    swalToast("success","Historial exportado");
  });

  // === Arranque ===
  (async function init(){
    try{ await ensureSwal(); }catch(_){}
    loadData();
  })();
});
