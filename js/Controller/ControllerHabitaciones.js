// js/Controller/ControllerHabitaciones.js
import {
  getHabitaciones,
  createHabitaciones,
  updateHabitaciones,
  deleteHabitaciones
} from "../Services/ServiceHabitaciones.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport    = document.querySelector(".btn-export");

  const $countAvail  = document.getElementById("countAvailable");
  const $countOcc    = document.getElementById("countOccupied");
  const $countClean  = document.getElementById("countCleaning");
  const $countMaint  = document.getElementById("countMaintenance");

  // --- SOLO para estados del modal ---
  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_ESTADOS = `${API_URL}/consultarEstadosHabitacion`;
  let ESTADOS = []; // {idEstadoHabitacion, nombreEstadoHabitacion}

  // ------- Estado -------
  let DATA = [];

  // ------- Utils -------
  const norm = (s) => (s ?? "").toString()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const money = (v) => {
    const n = Number(String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", "."));
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };

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

  const estadoKey = (val) => {
    const s = norm(val);
    if (s.includes("disp")) return "disponible";
    if (s.includes("ocup")) return "ocupada";
    if (s.includes("limp")) return "limpieza";
    if (s.includes("manten")) return "mantenimiento";
    if (val === 1 || s === "1") return "disponible";
    if (val === 2 || s === "2") return "ocupada";
    if (val === 3 || s === "3") return "limpieza";
    if (val === 4 || s === "4") return "mantenimiento";
    return "disponible";
  };

  const statusBadge = (estadoTxt) => {
    const t = estadoKey(estadoTxt);
    if (t === "disponible")    return `<span class="status-badge available">Disponible</span>`;
    if (t === "ocupada")       return `<span class="status-badge occupied">Ocupada</span>`;
    if (t === "limpieza")      return `<span class="status-badge cleaning">Limpieza</span>`;
    if (t === "mantenimiento") return `<span class="status-badge maintenance">Mantenimiento</span>`;
    return `<span class="status-badge other">${estadoTxt || "-"}</span>`;
  };

  // ------- Render -------
  const renderRow = (h) => {
    const id   = h.idHabitacion ?? h.id ?? "";
    const num  = h.numeroHabitacion ?? h.numero ?? "";
    // MOSTRAR nombre de la habitación en la col "Tipo"
    const nombreHab = h.nombreHabitacion ?? h.nombre ?? "-";
    const cap  = h.capacidadHabitacion ?? h.capacidad ?? "-";
    const prec = h.precioHabitacion ?? h.precio ?? 0;
    const est  = h.nombreEstadoHabitacion ?? h.estadoNombre ?? h.estado ?? h.idEstadoHabitacion ?? "";
    const out  = h.proximaSalida ?? h.fechaSalida ?? "-";

    const tr = document.createElement("tr");
    tr.dataset.idHabitacion = id;
    tr.innerHTML = `
      <td class="room-number">${num}</td>
      <td>${nombreHab}</td>
      <td>${cap}</td>
      <td>$${money(prec)}</td>
      <td>${statusBadge(est)}</td>
      <td>${out}</td>
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
      tbody.innerHTML = `<tr><td colspan="7">Actualmente no hay habitaciones</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };

  const contarEstados = (lista) => {
    let a=0,o=0,l=0,m=0;
    for (const h of lista) {
      const key = estadoKey(h.nombreEstadoHabitacion ?? h.estadoNombre ?? h.estado ?? h.idEstadoHabitacion);
      if (key === "disponible") a++;
      else if (key === "ocupada") o++;
      else if (key === "limpieza") l++;
      else if (key === "mantenimiento") m++;
    }
    $countAvail.textContent = a;
    $countOcc.textContent   = o;
    $countClean.textContent = l;
    $countMaint.textContent = m;
  };

  // ------- Filtros / búsqueda -------
  function applyFilters(){
    const q = norm(searchInput?.value || "");
    const f = norm(filterSelect?.value || "");
    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const numero = norm(tds[0]?.textContent || "");
      const nombre = norm(tds[1]?.textContent || ""); // ahora busca por nombre
      const estado = norm(tds[4]?.textContent || "");
      const okQ = !q || numero.includes(q) || nombre.includes(q);
      const okF = !f || estado.includes(f);
      tr.style.display = (okQ && okF) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  // ------- Exportar CSV -------
  btnExport?.addEventListener("click", ()=>{
    const rows = Array.from(tbody.querySelectorAll("tr")).filter(tr=>tr.style.display!=="none");
    if (!rows.length) return toast("info","No hay datos para exportar");
    const headers = ["Nº Habitación","Nombre","Capacidad","Precio/Noche","Estado","Próxima Salida"];
    const csv = [headers.join(",")];
    rows.forEach(tr=>{
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

  // ------- Estados (combo modal) -------
  async function loadEstados(){
    try{
      const res = await fetch(ENDPOINT_ESTADOS);
      const raw = await res.json();
      ESTADOS = normalizeList(raw);
    }catch(err){
      console.error("Error cargando estados:", err);
      ESTADOS = [];
    }
  }
  const optionsEstados = (selectedId=null) =>
    ESTADOS.map(x => {
      const id = x.idEstadoHabitacion ?? x.id ?? "";
      const name = x.nombreEstadoHabitacion ?? x.nombre ?? "Sin nombre";
      const sel = String(id) === String(selectedId) ? "selected" : "";
      return `<option value="${id}" ${sel}>${name}</option>`;
    }).join("");

  // ------- Modal (SweetAlert2) -------
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
      <div class="fg">
        <label>Nº Habitación</label>
        <input id="h-numero" class="input" type="number" min="1" placeholder="101" value="${vals.numero ?? ""}">
      </div>
      <div class="fg">
        <label>Nombre de la habitación</label>
        <input id="h-nombre" class="input" placeholder="Ej. Suite Ejecutiva" value="${vals.nombre ?? ""}">
      </div>

      <div class="fg">
        <label>Capacidad</label>
        <input id="h-cap" class="input" type="number" min="1" placeholder="2" value="${vals.capacidad ?? ""}">
      </div>
      <div class="fg">
        <label>Precio por noche</label>
        <input id="h-precio" class="input" type="number" step="0.01" min="0" placeholder="80.00" value="${vals.precio ?? ""}">
      </div>

      <div class="fg">
        <label>Estado</label>
        <select id="h-estado" class="input">
          <option value="">Seleccione...</option>
          ${optionsEstados(vals.idEstadoHabitacion)}
        </select>
      </div>

      <div class="fg full">
        <label>Descripción (opcional)</label>
        <textarea id="h-desc" class="textarea" rows="3" placeholder="Notas…">${vals.desc ?? ""}</textarea>
      </div>
    </div>
  `;

  const readModal = () => {
    const num   = document.getElementById("h-numero").value.trim();
    const nombre= document.getElementById("h-nombre").value.trim();
    const cap   = document.getElementById("h-cap").value.trim();
    const prec  = document.getElementById("h-precio").value.trim();
    const est   = document.getElementById("h-estado").value;
    const desc  = (document.getElementById("h-desc")?.value || "").trim();

    if (!num || !nombre || !cap || !prec || !est) {
      Swal.showValidationMessage("Completa todos los campos obligatorios.");
      return false;
    }
    return {
      numeroHabitacion: parseInt(num, 10),
      nombreHabitacion: nombre,
      capacidadHabitacion: parseInt(cap, 10),
      precioHabitacion: parseFloat(prec),
      idEstadoHabitacion: est,
      descripcionHabitacion: desc || null,
    };
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
      numero:  current.numeroHabitacion ?? current.numero ?? "",
      nombre:  current.nombreHabitacion ?? current.nombre ?? "",
      capacidad: current.capacidadHabitacion ?? current.capacidad ?? "",
      precio:    current.precioHabitacion ?? current.precio ?? "",
      idEstadoHabitacion: current.idEstadoHabitacion ?? "",
      desc: current.descripcionHabitacion ?? current.descripcion ?? "",
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

  // ------- CRUD -------
  async function loadHabitaciones(){
    tbody.innerHTML = `<tr><td colspan="7">Cargando . . .</td></tr>`;
    try{
      const raw = await getHabitaciones();
      DATA = normalizeList(raw);
      renderTabla(DATA);
      contarEstados(DATA);
      applyFilters();
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar habitaciones</td></tr>`;
      toast("error","Error cargando habitaciones");
    }
  }

  btnNueva?.addEventListener("click", async () => {
    try{
      await loadEstados();               // ← llena el select de estados
      const payload = await createDialog();
      if (!payload) return;

      await createHabitaciones(payload);
      toast("success","Habitación creada");
      await loadHabitaciones();
    }catch(e){
      console.error(e);
      toast("error","No se pudo crear");
    }
  });

  tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = e.target.closest("tr");
    const id = tr?.dataset.idHabitacion;
    if (!id) return;

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

    if (btn.classList.contains("edit")){
      try{
        await loadEstados(); // para el select de estados
        const current = DATA.find(x => String(x.idHabitacion ?? x.id) === String(id));
        if (!current) return;
        const payload = await editDialog(current);
        if (!payload) return;

        await updateHabitaciones(id, payload);
        toast("success","Habitación actualizada");
        await loadHabitaciones();
      }catch(e){
        console.error(e);
        toast("error","No se pudo actualizar");
      }
      return;
    }

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
        await deleteHabitaciones(id);
        toast("success","Habitación eliminada");
        await loadHabitaciones();
      }catch(e){
        console.error(e);
        toast("error","No se pudo eliminar");
      }
    }
  });

  // ------- Init -------
  loadHabitaciones();
});
