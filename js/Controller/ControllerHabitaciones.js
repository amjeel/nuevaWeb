import {
  getHabitaciones,
  createHabitaciones,
  updateHabitaciones,
  deleteHabitaciones
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

  let DATA = [];
  let TIPOS = [];
  let ESTADOS = [];

  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_TIPOS = `${API_URL}/consultarTiposHabitacion`;
  const ENDPOINT_ESTADOS = `${API_URL}/consultarEstadosHabitacion`;

  // ✅ Config Cloudinary
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dbubhdt8n/image/upload";
  const CLOUDINARY_PRESET = "finderhotel_unsigned";

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
    const imagen = h.imagenHabitacion && h.imagenHabitacion.trim() !== "" ? h.imagenHabitacion : "img/No disponible.png";
    tr.innerHTML = `
      <td>${h.numeroHabitacion}</td>
      <td>${h.nombreTipoHabitacion}</td>
      <td>${h.precioHabitacion}</td>
      <td><span class="status-badge ${estadoClase(h.nombreEstadoHabitacion)}">${estadoNombre(h.nombreEstadoHabitacion)}</span></td>
      <td><img src="${imagen}" alt="Imagen" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;"></td>
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
      tbody.innerHTML = `<tr><td colspan="7">No hay habitaciones registradas.</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="7">Cargando habitaciones...</td></tr>`;
    try {
      const raw = await getHabitaciones();
      DATA = Array.isArray(raw) ? raw : raw.content || [];
      renderTabla(DATA);
      contarEstados(DATA);
      applyFilters();
    } catch (e) {
      console.error("Error al cargar habitaciones:", e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar datos.</td></tr>`;
      toast("error", "Error al cargar habitaciones");
    }
  }

  // 🔹 Obtener tipos y estados desde API
  async function getCatalogos() {
    const [resTipos, resEstados] = await Promise.all([
      fetch(ENDPOINT_TIPOS).then(r => r.json()),
      fetch(ENDPOINT_ESTADOS).then(r => r.json())
    ]);
    TIPOS = Array.isArray(resTipos) ? resTipos : resTipos.data || [];
    ESTADOS = Array.isArray(resEstados) ? resEstados : resEstados.data || [];
  }

  // 💎 Modal bonito con Cloudinary + combos
  async function openModal(current = null) {
    await getCatalogos();
    const isEdit = !!current;

    const tipoOptions = TIPOS.map(
      (t) => `<option value="${t.nombreTipoHabitacion}" ${t.nombreTipoHabitacion === current?.nombreTipoHabitacion ? "selected" : ""}>${t.nombreTipoHabitacion}</option>`
    ).join("");

    const estadoOptions = ESTADOS.map(
      (e) => `<option value="${e.nombreEstadoHabitacion}" ${e.nombreEstadoHabitacion === current?.nombreEstadoHabitacion ? "selected" : ""}>${e.nombreEstadoHabitacion}</option>`
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
          .img-box { grid-column: span 2; text-align: center; margin-top: 8px; }
          .img-box img { width: 90px; height: 90px; border-radius: 8px; object-fit: cover; margin-top: 6px; display: none; }
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
          <div class="img-box">
            <label>Imagen</label>
            <input id="imagenFile" type="file" accept="image/*">
            <img id="previewImg" src="${current?.imagenHabitacion ?? ""}" style="display:${current?.imagenHabitacion ? "block" : "none"}">
          </div>
        </div>
      `,
      confirmButtonText: isEdit ? "Actualizar" : "Guardar",
      showCancelButton: true,
      confirmButtonColor: "#7b61ff",
      cancelButtonColor: "#6e7b85",
      focusConfirm: false,
      didOpen: () => {
        const fileInput = document.getElementById("imagenFile");
        const preview = document.getElementById("previewImg");
        fileInput.addEventListener("change", () => {
          const file = fileInput.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              preview.src = e.target.result;
              preview.style.display = "block";
            };
            reader.readAsDataURL(file);
          }
        });
      },
      preConfirm: async () => {
        const fileInput = document.getElementById("imagenFile");
        let imageUrl = current?.imagenHabitacion ?? "";

        // Subir a Cloudinary si hay nueva imagen
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_PRESET);

          Swal.fire({
            title: "Subiendo imagen...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });

          const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
          const data = await res.json();
          Swal.close();
          imageUrl = data.secure_url;
        }

        return {
          numeroHabitacion: document.getElementById("h-numero").value.trim(),
          nombreTipoHabitacion: document.getElementById("h-tipo").value,
          precioHabitacion: document.getElementById("h-precio").value.trim(),
          nombreEstadoHabitacion: document.getElementById("h-estado").value,
          imagenHabitacion: imageUrl
        };
      }
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      const data = res.value;
      if (!data.numeroHabitacion || !data.nombreTipoHabitacion || !data.precioHabitacion)
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

  /* ---------- Eventos ---------- */
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