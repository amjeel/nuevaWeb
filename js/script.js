document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Credenciales válidas (solo para demostración en el cliente)
    const validUser = "adriana@finder.com";
    const validPass = "1234";

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita el envío predeterminado del formulario

        // Limpiar mensajes de error previos
        emailError.textContent = '';
        passwordError.textContent = '';
        let isValid = true;

        // Validación de Correo Electrónico 
        if (emailInput.value.trim() === '') {
            emailError.textContent = 'El correo electrónico no puede estar vacío.';
            isValid = false;
        } else if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
            emailError.textContent = 'Por favor, ingresa un correo electrónico válido.';
            isValid = false;
        }

        // Validación de Contraseña
        if (passwordInput.value.trim() === '') {
            passwordError.textContent = 'La contraseña no puede estar vacía.';
            isValid = false;
        }

        // Si las validaciones básicas de formato pasan, verificar credenciales
        if (isValid) {
            // Aquí simularíamos la verificación con las credenciales dadas
            if (emailInput.value === validUser && passwordInput.value === validPass) {
                alert('¡Inicio de sesión exitoso!');
                window.location.href = 'dashboard.html';
            } else {
                alert('Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.');
                emailError.textContent = 'Usuario o contraseña incorrectos.';
                passwordError.textContent = 'Usuario o contraseña incorrectos.';
            }
        }
    });
});