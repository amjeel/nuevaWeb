// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {

            window.location.href = 'index.html'; // Redirige a la página de login

        });
    }


});