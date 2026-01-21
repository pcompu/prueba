document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1. Leer número desde la URL
  // =========================
  const params = new URLSearchParams(window.location.search);
  const numeroParam = params.get("numero");
  const numero = Number(numeroParam);

  // =========================
  // 2. Referencias al DOM
  // =========================
  const chatHeader = document.querySelector(".chat-header");
  const chatHistory = document.getElementById("chatHistory");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");

  // =========================
  // 3. Configuración según el número
  // =========================
  let nivel = 1;

  if (!isNaN(numero)) {
    nivel = numero;
    chatHeader.textContent = `Chat de PC – Nivel ${nivel}`;
  } else {
    chatHeader.textContent = "Chat de PC – Nivel por defecto";
  }

  // =========================
  // 4. Mensaje inicial del sistema
  // =========================
  agregarMensaje(
    "sistema",
    `Bienvenido/a. Estás usando el chat en el nivel ${nivel}.`
  );

  // =========================
  // 5. Envío de mensajes
  // =========================
  sendButton.addEventListener("click", enviarMensaje);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      enviarMensaje();
    }
  });

  function enviarMensaje() {
    const texto = messageInput.value.trim();
    if (texto === "") return;

    agregarMensaje("usuario", texto);
    messageInput.value = "";

    // Respuesta simulada según el nivel
    setTimeout(() => {
      responderSegunNivel(nivel);
    }, 500);
  }

  // =========================
  // 6. Respuestas simuladas
  // =========================
  function responderSegunNivel(nivel) {
    let respuesta;

    switch (nivel) {
      case 1:
        respuesta = "Respuesta básica del sistema.";
        break;
      case 2:
        respuesta = "Respuesta intermedia del sistema, con más detalle.";
        break;
      case 3:
        respuesta = "Respuesta avanzada del sistema, más compleja.";
        break;
      default:
        respuesta = "Respuesta genérica del sistema.";
    }

    agregarMensaje("sistema", respuesta);
  }

  // =========================
  // 7. Función para agregar mensajes al chat
  // =========================
  function agregarMensaje(tipo, texto) {
    const mensaje = document.createElement("div");
    mensaje.classList.add("mb-2", "p-2", "rounded");

    if (tipo === "usuario") {
      mensaje.classList.add("bg-primary", "text-white", "text-end");
    } else {
      mensaje.classList.add("bg-light", "text-dark");
    }

    mensaje.textContent = texto;
    chatHistory.appendChild(mensaje);

    // Scroll automático al final
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
});
