import { 
  getReservas, 
  getHabitaciones, 
  getClientes, 
  getCheckIn, 
  getCheckOut 
} from "../Services/ServicesDashboard.js";

async function loadHighlightCards() {
  const reservas = await getReservas();
  const habitaciones = await getHabitaciones();
  const clientes = await getClientes();
  const checkins = await getCheckIn();
  const checkouts = await getCheckOut();

  console.log("Reservas:", reservas);
  console.log("Habitaciones:", habitaciones);
  console.log("Clientes:", clientes);
  console.log("CheckIns:", checkins);
  console.log("CheckOuts:", checkouts);
    // --- Reservas ---
  document.getElementById("reservasActivas").textContent = reservas.length;

  // --- Habitaciones ---
  document.getElementById("habitacionesDisponibles").textContent = habitaciones.length;
  document.getElementById("totalHabitaciones").textContent = habitaciones.length;

  // --- Clientes ---
  document.getElementById("huespedesActuales").textContent = clientes.length;

  // --- Check-ins ---
  document.getElementById("checkinsHoy").textContent = checkins.length;

  // --- Check-outs ---
  document.getElementById("checkoutsHoy").textContent = checkouts.length;
}

document.addEventListener("DOMContentLoaded", loadHighlightCards);
