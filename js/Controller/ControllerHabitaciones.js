import {
  getHabitaciones,
  createHabitaciones,
  updateHabitaciones,
  deleteHabitaciones,
  consultarEstadosHabitacion,
  consultarTiposHabitacion,
} from "../Services/ServiceHabitaciones.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector(".data-table tbody");
  const btnNueva = document.querySelector(".back-button");
  const searchInput = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");

  const $countAvail = document.getElementById("countAvailable");
  const $countOcc = document.getElementById("countOccupied");
  const $countClean = document.getElementById("countCleaning");
  const $countMaint = document.getElementById("countMaintenance");
  const idEstadoHabitacion = document.getElementById("h-estado");
  const idTipoHabitacion = document.getElementById("h-tipo");

  let DATA = [];
  let TIPOS = [];
  let ESTADOS = [];

  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_TIPOS = `${API_URL}/consultarTiposHabitacion`;
  const ENDPOINT_ESTADOS = `${API_URL}/consultarEstadosHabitacion`;

  const toast = (icon = "success", title = "") =>
    Swal.fire({
      toast: true, position: "bottom-end", icon, title,
      timer: 1600, showConfirmButton: false, timerProgressBar: true
    });

  const norm = (s) => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const estadoNombre = (val) => {
    const s = norm(val);
    if (s.includes("disponible")) return "Disponible";
    if (s.includes("ocupada")) return "Ocupada";
    if (s.includes("reservada")) return "Reservada";
    if (s.includes("mantenimiento")) return "En Mantenimiento";
    return val || "-";
  };

  const estadoClase = (val) => {
    const t = estadoNombre(val);
    return t === "Disponible" ? "available" :
      t === "Ocupada" ? "occupied" :
        t === "Reservada" ? "cleaning" :
          t === "En Mantenimiento" ? "maintenance" : "other";
  };

  const renderRow = (h) => {
    const tr = document.createElement("tr");
    tr.dataset.idHabitacion = h.idHabitacion;
    tr.innerHTML = `
      <td>${h.numeroHabitacion}</td>
      <td>${h.nombreTipoHabitacion}</td>
      <td>${h.precioHabitacion}</td>
      <td><span class="status-badge ${estadoClase(h.nombreEstadoHabitacion)}">${estadoNombre(h.nombreEstadoHabitacion)}</span></td>
      <td>
        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  const renderTabla = (lista) => {
    tbody.innerHTML = "";
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="6">No hay habitaciones registradas.</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };

  const contarEstados = (lista) => {
    let d = 0, o = 0, l = 0, m = 0;
    for (const h of lista) {
      const e = estadoNombre(h.nombreEstadoHabitacion);
      if (e === "Disponible") d++;
      else if (e === "Ocupada") o++;
      else if (e === "Reservada") l++;
      else if (e === "En Mantenimiento") m++;
    }
    $countAvail.textContent = d;
    $countOcc.textContent = o;
    $countClean.textContent = l;
    $countMaint.textContent = m;
  };

  function applyFilters() {
    const q = norm(searchInput?.value || "");
    const f = norm(filterSelect?.value || "");

    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const num = norm(tds[0]?.textContent || "");
      const tipo = norm(tds[1]?.textContent || "");
      const estado = norm(tds[3]?.textContent || "");
      const okQ = !q || num.includes(q) || tipo.includes(q);
      const okF = !f || estado.includes(f);
      tr.style.display = (okQ && okF) ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  async function loadHabitaciones() {
    tbody.innerHTML = `<tr><td colspan="6">Cargando habitaciones...</td></tr>`;
    try {
      const raw = await getHabitaciones();
      DATA = Array.isArray(raw) ? raw : raw.content || [];
      renderTabla(DATA);
      contarEstados(DATA);
      applyFilters();
    } catch (e) {
      console.error("Error al cargar habitaciones:", e);
      tbody.innerHTML = `<tr><td colspan="6">Error al cargar datos.</td></tr>`;
      toast("error", "Error al cargar habitaciones");
    }
  }

  async function CargarTiposHabitacion(selectItem) {
    try {
      const data = await consultarTiposHabitacion();
      const TiposHabitacion = data.content;

      selectItem.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.hidden = true;
      opt.textContent = "Seleccione...";
      selectItem.appendChild(opt);

      TiposHabitacion.forEach((t) => {
        const option = document.createElement("option");
        option.value = t.idTipoHabitacion;
        option.textContent = t.nombreTipoHabitacion;
        selectItem.appendChild(option);
      });
    } catch (err) {
      Swal.fire("Error", "Error al cargar los tipos de habitación: " + err, "error");
    }
  }

  async function CargarEstadosHabitacion(selectItem) {
    try {
      const data = await consultarEstadosHabitacion();
      const EstadosHabitacion = data.content;

      selectItem.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.hidden = true;
      opt.textContent = "Seleccione...";
      selectItem.appendChild(opt);

      EstadosHabitacion.forEach((e) => {
        const option = document.createElement("option");
        option.value = e.idEstadoHabitacion;
        option.textContent = e.nombreEstadoHabitacion;
        selectItem.appendChild(option);
      });
    } catch (err) {
      Swal.fire("Error", "Error al cargar los estados de habitación: " + err, "error");
    }
  }

  async function getCatalogos() {
    const [resTipos, resEstados] = await Promise.all([
      fetch(ENDPOINT_TIPOS, { credentials: "include" }).then(r => r.json()),
      fetch(ENDPOINT_ESTADOS, { credentials: "include" }).then(r => r.json())
    ]);
    TIPOS = Array.isArray(resTipos) ? resTipos : resTipos.data || [];
    ESTADOS = Array.isArray(resEstados) ? resEstados : resEstados.data || [];
  }

  async function openModal(current = null) {
    await getCatalogos();
    const isEdit = !!current;

    const tipoOptions = TIPOS.map(
      (t) => `<option value="${t.nombreTipoHabitacion}" ${t.nombreTipoHabitacion === current?.nombreTipoHabitacion ? "selected" : ""}>${t.nombreTipoHabitacion}</option>`
    ).join("");

    const estadoOptions = ESTADOS.map(
      (e) => `<option value="${e.idEstadoHabitacion}" ${e.nombreEstadoHabitacion === current?.nombreEstadoHabitacion ? "selected" : ""}>${e.nombreEstadoHabitacion}</option>`
    ).join("");

    await Swal.fire({
      title: isEdit ? `Editar habitación ${current.numeroHabitacion}` : "Nueva Habitación",
      html: `
        <style>
          .swal2-modern {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 15px;
            text-align: left;
          }
          .swal2-modern label { font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block; }
          .swal2-modern input, .swal2-modern select {
            width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc;
          }
        </style>

        <div class="swal2-modern">
          <div>
            <label>N° Habitación</label>
            <input id="h-numero" type="number" value="${current?.numeroHabitacion ?? ""}">
          </div>
          <div>
            <label>Tipo de Habitación</label>
            <select id="h-tipo">${tipoOptions}</select>
          </div>
          <div>
            <label>Precio por Noche ($)</label>
            <input id="h-precio" type="number" step="0.01" value="${current?.precioHabitacion ?? ""}">
          </div>
          <div>
            <label>Estado</label>
            <select id="h-estado">${estadoOptions}</select>
          </div>
        </div>
      `,
      confirmButtonText: isEdit ? "Actualizar" : "Guardar",
      showCancelButton: true,
      confirmButtonColor: "#7b61ff",
      cancelButtonColor: "#6e7b85",
      focusConfirm: false,
      didOpen: () => {
        const idEstadoHabitacion = document.getElementById("h-estado");
        CargarEstadosHabitacion(idEstadoHabitacion);

        const idTipoHabitacion = document.getElementById("h-tipo");
        CargarTiposHabitacion(idTipoHabitacion);
      },
      preConfirm: () => ({
        numeroHabitacion: document.getElementById("h-numero").value.trim(),
        idTipoHabitacion: document.getElementById("h-tipo").value,
        precioHabitacion: document.getElementById("h-precio").value.trim(),
        idEstadoHabitacion: document.getElementById("h-estado").value,
      })
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const data = res.value;
      if (!data.numeroHabitacion || !data.idTipoHabitacion || !data.precioHabitacion)
        return toast("error", "Completa todos los campos obligatorios");

      if (isEdit) {
        await updateHabitaciones(current.idHabitacion, data);
        toast("success", "Habitación actualizada");
      } else {
        await createHabitaciones(data);
        toast("success", "Habitación creada");
      }
      loadHabitaciones();
    });
  }

  btnNueva.addEventListener("click", () => openModal());

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const tr = e.target.closest("tr");
    const id = tr?.dataset.idHabitacion;
    if (!id) return;

    if (btn.classList.contains("edit")) {
      const current = DATA.find(x => String(x.idHabitacion) === id);
      openModal(current);
    }

    if (btn.classList.contains("delete")) {
      const { isConfirmed } = await Swal.fire({
        title: "¿Eliminar habitación?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning", showCancelButton: true,
        confirmButtonText: "Eliminar", cancelButtonText: "Cancelar"
      });
      if (!isConfirmed) return;
      await deleteHabitaciones(id);
      toast("success", "Habitación eliminada");
      loadHabitaciones();
    }
  });

  loadHabitaciones();
});
