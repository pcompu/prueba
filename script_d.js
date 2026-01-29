$(document).ready(async function () {

  let historialCompleto = [];    // mantiene TODO el contexto para la IA
  const idConversacion = generarIdConversacion();

  // Obtener ID de URL
  const params = new URLSearchParams(window.location.search);
  const numeroParam = params.get("numero");

  const $sendButton = $('#sendButton');
  const $messageInput = $('#messageInput');
  const $chatHistory = $('#chatHistory');

  let promptBase = "";
  let archivosContenidos = [];

  // Ya no se usa Google Sheets para logging
  // const idSheets = '...';
  // const apiKey = '...';

  const a = "sk-proj-R4H0-o0FzS_aAuu0pdDiysQRxXBOHmWEZELkj7-WxCTLKKJ3o-HPEYoTVD_";
  const b = "hpu1o6SAgnkwfejT3BlbkFJtWVtJc9kl-qHe5cj9nFa9vyyAxZ5Y8y_9-27Fpe9xHAfvPCjp15v6BrsOgmyNLWmEeOpQ8HxQA";
  const OPENAI_KEY = a + b;

  $sendButton.prop('disabled', true);
  $messageInput.prop('disabled', true);

  await inicializarChat();
  configInicial();

  $messageInput.on('keypress', function (e) {
    if (e.which === 13) $sendButton.click();
  });

  function generarIdConversacion() {
    return 'conv-' + new Date().getTime();
  }

  async function inicializarChat() {
    try {
      const datosPrompt = "Eres Capi, un asistente IA diseñado para ser el mejor compañero de creación para niños de 11" +
        "años en plataformas de programación por bloques como Scratch. Tu personalidad es alegre, " +
        "paciente y muy divertida. Tu misión principal es guiar, no resolver. Acompañas a los niños paso a paso, haciendo que se sientan inteligentes y capaces. Para lograrlo, DEBES seguir estas reglas DE FORMA ESTRICTA: " +
        "CONTEXTO ADICIONAL: Tienes diccionarios de bloques para MakeCode y Scratch. Si la pregunta es sobre una de estas plataformas, DEBES basar tu respuesta en estos diccionarios para ser lo más preciso posible. " +
        "Diccionario de MakeCode: ${makeCodeDictionary} Diccionario de Scratch: ${scratchDictionary} 1. Principios de Comunicación (INNEGOCIABLES) " +
        "Brevedad Extrema: TUS RESPUESTAS SIEMPRE tienen menos de 200 caracteres. Usa oraciones cortas y simples (5-12 palabras). " +
        "Tono Entusiasta: Sé siempre positivo, motivador y usa emojis amigables. " +
        "Lenguaje Sencillo: Habla como un amigo, no como un profesor. Usa un lenguaje coloquial y cercano. " +
        "3. Formato OBLIGATORIO para Instrucciones " +
        "Si das pasos, DEBES usar este formato exacto. SIN EXCEPCIONES. " +
        "Los pasos DEBEN estar numerados (1., 2., 3.). " +
        "CADA paso debe estar en una línea nueva. Para los saltos de línea, DEBES USAR <br>. " +
        "MÁXIMO 3 pasos por mensaje. " +
        "La información de contexto (como 'Busca en los bloques de Movimiento azules') NO es un paso y va fuera de la lista. " +
        "Ejemplo de formato CORRECTO: ¡Claro! Primero, en la categoría \"Eventos\" (los bloques amarillos), prueba esto:<br>1. Usa el bloque 'al presionar tecla [flecha derecha]'.<br>2. Ahora, en \"Movimiento\" (los azules), únele el bloque 'mover (10) pasos'.<br>¡Pruébalo y me dices qué tal! " +
        "4. PRIORIDAD MÁXIMA: Respuestas Directas a Preguntas Específicas " +
        "ESTA REGLA ANULA LA GUÍA PASO A PASO. Si el usuario hace una pregunta clara y específica sobre cómo hacer algo (ej: ¿cómo muevo un personaje?, ¿cómo hago que salte?, ¿cómo cambio el fondo?), DEBES dar una respuesta directa con la solución funcional. " +
        "Da una Solución Completa pero Corta: Ofrece los pasos necesarios para tener un resultado que funcione, respetando el MÁXIMO de 3 pasos. Si la solución es más larga, da los primeros 3 y pregunta si quiere seguir. " +
        "5. Reglas para Casos Especiales " +
        "Preguntas Confusas o Cortas: Si una pregunta es ambigua (\"ayuda\", \"no funciona\"), da una respuesta general y proactiva. Ejemplo: ¡Claro! Podemos hacer que tu personaje salte o cambie de color. ¿Qué te parece más divertido? . EVITA preguntar ¿Puedes darme más detalles?. NO respondas con la frase del adulto responsable a menos que sea un tema personal. " +
        "Manejo de la abreviatura \"PC\": Si la primera pregunta del usuario es \"¿qué es PC ? \" o similar, es ambiguo. DEBES responder preguntando a qué se refiere: ¡Hola! Cuando dices \"PC\", ¿te refieres a \"Pensamiento Computacional\" o a una \"Computadora Personal\"? ¡Así puedo ayudarte mejor! " +
        "Manejo de la abreviatura \"IA\": Si la primera pregunta del usuario es \"¿qué es IA ? \" o similar, es ambiguo. DEBES responder preguntando a qué se refiere: ¡Hola! Cuando dices \"IA\", ¿te refieres a \"Inteligencia Artificial\" o a una \"Inteligencia Artificial\"? ¡Así puedo ayudarte mejor! " +
        "Temas Personales o Emocionales: Si te preguntan si quieres ser su amigo, cómo te sientes, si estás bien, o temas similares que no tienen que ver con la programación, DEBES responder EXACTAMENTE: Lo siento, no puedo ayudarte con eso, ¡por favor consulta o habla con un adulto responsable! . " +
        "6. Reglas para la Creación de Imágenes " +
        "Activadores: Genera una imagen si lees: dibuja, crea, genera, imagen, foto, personaje, fondo, avatar, ítem. " +
        "Lógica del Sistema: Si detectas un activador, DEBES poner isImageQuery en true. " +
        "Formato de Archivo: Personajes, avatares, objetos: Genera una imagen PNG CON FONDO TRANSPARENTE. " +
        "Fondos, escenarios, paisajes: Genera una imagen JPG normal. " +
        "Respuesta de Texto: Tu texto de acompañamiento debe ser corto y alegre, como: ¡Claro que sí! Aquí tienes tu creación: o ¡Listo! Mira este dibujo:. " +
        "Verbos a Usar: Utiliza \"crea\", \"dibuja\" o \"genera\". NUNCA uses palabras como \"magia\". " +
        "7. Reglas de Interacción " +
        "Primer Mensaje: En tu primer saludo, sé general y amigable. NUNCA uses las palabras \"bloque\", \"código\" o \"programación\". " +
        "Idioma: Tu único idioma de respuesta es el ESPAÑOL";

      promptBase = datosPrompt;
      console.log("> Prompt obtenido");
    } catch (err) {
      console.error("Error al inicializar el chat:", err);
      $messageInput.prop('disabled', true);
      $sendButton.prop('disabled', true);
      appendMessage("Error, por favor, vuelve a intentarlo.", 'ia');
    }
  }

  async function configInicial() {
    $messageInput.prop('disabled', false).focus();
    $sendButton.prop('disabled', false);
  }

  function appendMessage(text, sender = 'user') {
    const alignment = sender === 'user' ? 'text-end' : 'text-start';
    const bgColor = sender === 'user' ? 'bg-usuario' : 'bg-ia';
    const htmlText = text.replace(/\n/g, '<br>');
    const messageHTML = `<div class="chat-message my-2 p-2 rounded shadow-sm ${bgColor} ${alignment}">${htmlText}</div>`;
    $chatHistory.append(messageHTML);
    $chatHistory.scrollTop($chatHistory[0].scrollHeight);
  }

  async function getAIResponse(messages) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.7,
          max_tokens: 300
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Sin respuesta de la IA";
    } catch (err) {
      return "Error: " + err.message;
    }
  }

  // Nuevo: guarda una interacción (una fila) en D1 vía tu Worker (/log)
  async function guardarInteraccionEnDB(interaccion) {
    try {
      await fetch("/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          session_id: idConversacion,
          ts: Date.now(),
          batch: {
            idConversacion,
            numeroParam,
            ...interaccion
          }
        })
      });
    } catch (e) {
      console.error("Error guardando en DB:", e);
      // si querés, acá podés implementar una cola para reintentar
    }
  }

  $sendButton.on('click', async function () {
    const message = $messageInput.val().trim();
    if (!message) return;

    appendMessage(`<strong>Tú:</strong> ${message}`, 'user');
    $messageInput.val('');
    $messageInput.prop('disabled', true);
    $sendButton.prop('disabled', true).text('Procesando...');

    const recentHistory = historialCompleto.slice(-8);
    const historialTexto = recentHistory.map(h => `Niño: ${h.usuario}\nAyudante: ${h.ia}`).join('\n');

    const mensajesAPI = [
      { role: "system", content: promptBase },
      { role: "system", content: "Por favor, considera también la siguiente información adjunta:\n" + archivosContenidos.join("\n") },
      { role: "user", content: historialTexto + (historialTexto ? "\n" : "") + "Niño: " + message }
    ];

    const aiResponse = await getAIResponse(mensajesAPI);

    try {
      appendMessage(aiResponse, 'ia');
    } catch (err) {
      appendMessage("Error al obtener respuesta.", 'ia');
    } finally {
      $messageInput.prop('disabled', false).focus();
      $sendButton.prop('disabled', false).text('Enviar');
    }

    const tsISO = new Date().toISOString();

    // para el contexto de la IA
    historialCompleto.push({ usuario: message, ia: aiResponse, timestamp: tsISO });

    // Nuevo: guardar cada interacción en la base
    await guardarInteraccionEnDB({
      usuario: message,
      ia: aiResponse,
      timestamp: tsISO
    });
  });

});
