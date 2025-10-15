const API_URL = "http://localhost:8080/api";

// 🔹 Helper: siempre retorna array plano
async function fetchArray(endpoint, errorMsg) {
  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error(errorMsg);

    const data = await res.json();

    // Si es array lo devuelvo tal cual
    if (Array.isArray(data)) return data;

    // Si es Page (tiene content), devuelvo content
    if (data && Array.isArray(data.content)) return data.content;

    // Si tiene totalElements pero no content, devuelvo array vacío del tamaño
    if (data && typeof data.totalElements === "number") {
      return new Array(data.totalElements).fill({});
    }

    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// --- Endpoints ---
export function getReservas() {
  return fetchArray("consultarReservas", "Error al consultar reservas");
}

export function getHabitaciones() {
  return fetchArray("consultarHabitaciones", "Error al consultar habitaciones");
}

export function getClientes() {
  return fetchArray("consultarClientes", "Error al consultar clientes");
}

export function getCheckIn() {
  return fetchArray("consultarCheckIns", "Error al consultar check-ins");
}

export function getCheckOut() {
  return fetchArray("consultarCheckOuts", "Error al consultar check-outs");
}
