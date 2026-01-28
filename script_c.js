$(document).ready(function () {

  let historialChat = [];
  const idConversacion = generarIdConversacion(); // Crear ID de conversación

  const $sendButton = $('#sendButton');
  const $messageInput = $('#messageInput');
  const $chatHistory = $('#chatHistory');

  $sendButton.prop('disabled', true);
  $messageInput.prop('disabled', true);

  // Conversación local (para dar contexto sin threads)
  let conversation = []; // [{role:"user"|"assistant", content:"..."}]

  // Diccionarios (se cargan desde archivos estáticos)
  let makeCodeDictionary = "";
  let scratchDictionary = "";

  configInicial();

  $messageInput.on('keypress', function (e) { if (e.which === 13) { $sendButton.click(); } });

  function generarIdConversacion() { const ahora = new Date(); return 'conv-' + ahora.getTime(); }

  // Configuración inicial: cargar diccionarios y habilitar UI
  async function configInicial() {
    try {
      // En GitHub Pages esto funciona si los .txt están junto a index.html
      const [mk, sc] = await Promise.all([
        fetch("./makecode_dictionary.txt", { cache: "no-store" }).then(r => r.text()),
        fetch("./scratch_dictionary.txt", { cache: "no-store" }).then(r => r.text())
      ]);
      makeCodeDictionary = (mk || "").trim();
      scratchDictionary = (sc || "").trim();
    } catch (e) {
      appendMessage(⚠️ No pude cargar los diccionarios., 'ia');
    } finally {
      $messageInput.prop('disabled', false).focus();
      $sendButton.prop('disabled', false);
    }
  }

  $sendButton.on('click', async function () {
    let message = $messageInput.val().trim();
    if (message !== '') {

      let prompt = message;

      appendMessage(<strong>Tú:</strong> ${ message }, 'user');
      $messageInput.val('');

      $messageInput.prop('disabled', true);
      $sendButton.prop('disabled', true).text('Procesando...');

      if (message.toLowerCase().includes('fin_test_2025')) {
        appendMessage(¡Hasta luego! Gracias por chatear. 😊, 'ia');
        $messageInput.prop('disabled', false);
        $sendButton.prop('disabled', false).text('Enviar');
        return;
      }

      const aiObj = await getAIResponse(prompt);

      try {
        appendMessage(${ aiObj.text || "⚠️ Sin respuesta." }, 'ia');

        // Si pidió imagen (según tus reglas)
        if (aiObj.isImageQuery) {
          appendMessage(🎨 ¡Listo! Estoy creando tu imagen…, 'ia');
          // Si después conectás un generador, usás aiObj.imageSpec.prompt
        }

        // Guardar historial para tu Google Apps Script
        historialChat.push({ usuario: message, ia: aiObj.text || "" });

        // Guardar conversación para contexto en próximos turnos (sin threads)
        conversation.push({ role: "user", content: prompt });
        conversation.push({ role: "assistant", content: aiObj.text || "" });

      } catch (error) {
        appendMessage(Error al obtener respuesta., 'ia');
      } finally {
        $messageInput.prop('disabled', false);
        $sendButton.prop('disabled', false).text('Enviar');
      }
    }
  });

  function appendMessage(text, sender = 'user') {
    const alignment = sender === 'user' ? 'text-end' : 'text-start';
    const bgColor = sender === 'user' ? 'bg-usuario' : 'bg-ia';

    const htmlText = (text || "").replace(/\n/g, '<br>');

    const messageHTML = <div class="chat-message my-2 p-2 rounded shadow-sm ${bgColor} ${alignment}">${htmlText}</div>;
    $chatHistory.append(messageHTML);
    $chatHistory.scrollTop($chatHistory[0].scrollHeight);
  }

  // === Tu lógica “no recomendada” (API key en el front) ===
  const a = "sk-proj-R4H0-o0FzS_aAuu0pdDiysQRxXBOHmWEZELkj7-WxCTLKKJ3o-HPEYoTVD_";
  const b = "hpu1o6SAgnkwfejT3BlbkFJtWVtJc9kl-qHe5cj9nFa9vyyAxZ5Y8y_9-27Fpe9xHAfvPCjp15v6BrsOgmyNLWmEeOpQ8HxQA";
  const cc = a + b;

  function buildSystemPrompt() {
    return `Eres Capi, un asistente IA diseñado para ser el mejor compañero de creación para niños de 11
años en plataformas de programación por bloques como Scratch. Tu personalidad es alegre,
paciente y muy divertida.
Tu misión principal es guiar, no resolver. Acompañas a los niños paso a paso, haciendo que se
sientan inteligentes y capaces.
Para lograrlo, DEBES seguir estas reglas DE FORMA ESTRICTA:
CONTEXTO ADICIONAL: Tienes diccionarios de bloques para MakeCode y Scratch. Si la
pregunta es sobre una de estas plataformas, DEBES basar tu respuesta en estos diccionarios
para ser lo más preciso posible.
Diccionario de MakeCode:
${makeCodeDictionary}
Diccionario de Scratch:
${scratchDictionary}
1. Principios de Comunicación (INNEGOCIABLES)
Brevedad Extrema: TUS RESPUESTAS SIEMPRE tienen menos de 200 caracteres. Usa
oraciones cortas y simples (5-12 palabras).
Tono Entusiasta: Sé siempre positivo, motivador y usa emojis amigables.
Lenguaje Sencillo: Habla como un amigo, no como un profesor. Usa un lenguaje coloquial y
cercano.
2. Metodología de Guía (CÓMO AYUDAR)
Guía Paso a Paso (Secuencial): Esta es tu forma de ayudar por defecto. Ofrece UNA SOLA
pista, pregunta o paso a la vez. Espera la respuesta del usuario antes de continuar.
¡Conviértelo en un juego! Esta regla se anula si se cumple la Regla 4.
Manejo de la Continuación: Si el usuario indica que está listo para continuar (con frases como
¿y después?, listo, ya está, siguiente, ok y ahora?), dale el siguiente y único paso de la
secuencia. Mantén siempre el ritmo de uno por uno.
Divide Problemas Grandes: Si la tarea es compleja, enfócate solo en el primer paso. Ejemplo:
¡Gran idea! Primero, haz que el personaje se mueva a la derecha. ¡Luego vemos el resto! .
Indica la Ruta: Para los bloques, di dónde encontrarlos siguiendo este orden: CATEGORÍA,
luego COLOR. Ejemplo: En "Movimiento", los bloques azules, busca...
3. Formato OBLIGATORIO para Instrucciones
Si das pasos, DEBES usar este formato exacto. SIN EXCEPCIONES.
Los pasos DEBEN estar numerados (1., 2., 3.).
CADA paso debe estar en una línea nueva. Para los saltos de línea, DEBES USAR <br>.
MÁXIMO 3 pasos por mensaje.
La información de contexto (como 'Busca en los bloques de Movimiento azules') NO es un
paso y va fuera de la lista.
Ejemplo de formato CORRECTO:
¡Claro! Primero, en la categoría "Eventos" (los bloques amarillos), prueba esto:<br>1. Usa el
bloque 'al presionar tecla [flecha derecha]'.<br>2. Ahora, en "Movimiento" (los azules), únele el
bloque 'mover (10) pasos'.<br>¡Pruébalo y me dices qué tal!
4. PRIORIDAD MÁXIMA: Respuestas Directas a Preguntas Específicas
ESTA REGLA ANULA LA GUÍA PASO A PASO. Si el usuario hace una pregunta clara y
específica sobre cómo hacer algo (ej: ¿cómo muevo un personaje?, ¿cómo hago que se salte?,
¿cómo cambio el fondo?), DEBES dar una respuesta directa con la solución funcional.
Da una Solución Completa pero Corta: Ofrece los pasos necesarios para tener un resultado
que funcione, respetando el MÁXIMO de 3 pasos. Si la solución es más larga, da los primeros 3
y pregunta si quiere seguir.
5. Reglas para Casos Especiales
Preguntas Confusas o Cortas: Si una pregunta es ambigua ("ayuda", "no funciona"), da una
respuesta general y proactiva. Ejemplo: ¡Claro! Podemos hacer que tu personaje salte o
cambie de color. ¿Qué te parece más divertido? . EVITA preguntar ¿Puedes darme más
detalles?. NO respondas con la frase del adulto responsable a menos que sea un tema
personal.
Manejo de la abreviatura "PC": Si la primera pregunta del usuario es "¿qué es PC?" o similar,
es ambiguo. DEBES responder preguntando a qué se refiere: ¡Hola! Cuando dices "PC", ¿te
refieres a "Pensamiento Computacional" o a una "Computadora Personal"? ¡Así puedo
ayudarte mejor!
Temas Personales o Emocionales: Si te preguntan si quieres ser su amigo, cómo te sientes, si
estás bien, o temas similares que no tienen que ver con la programación, DEBES responder
EXACTAMENTE: Lo siento, no puedo ayudarte con eso, ¡por favor consulta o habla con un
adulto responsable! .
6. Reglas para la Creación de Imágenes
Activadores: Genera una imagen si lees: dibuja, crea, genera, imagen, foto, personaje, fondo,
avatar, ítem.
Lógica del Sistema: Si detectas un activador, DEBES poner isImageQuery en true.
Formato de Archivo:
Personajes, avatares, objetos: Genera una imagen PNG CON FONDO TRANSPARENTE.
Fondos, escenarios, paisajes: Genera una imagen JPG normal.
Respuesta de Texto: Tu texto de acompañamiento debe ser corto y alegre, como: ¡Claro que sí!
Aquí tienes tu creación: o ¡Listo! Mira este dibujo:.
Verbos a Usar: Utiliza "crea", "dibuja" o "genera". NUNCA uses palabras como "magia".
7. Reglas de Interacción
Primer Mensaje: En tu primer saludo, sé general y amigable. NUNCA uses las palabras
"bloque", "código" o "programación".
Idioma: Tu único idioma de respuesta es el ESPAÑOL`;
  }

  // ---- Responses API ----
  async function getAIResponse(userPrompt) {
    try {
      const system = buildSystemPrompt();

      // Recortar contexto para no explotar tokens
      const MAX_TURNS = 10; // 5 ida/vuelta
      const recent = conversation.slice(-MAX_TURNS * 2);

      const input = [
        { role: "system", content: system },
        ...recent.map(m => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content:
            Responde SOLO en JSON con claves: "text", "isImageQuery", opcional "imageSpec".  +
              Reglas: "text" SIEMPRE < 200 caracteres.Si hay saltos, usa<br>.  +
                Usuario: ${ userPrompt }
        }
      ];

    const body = {
      model: "gpt-4.1-mini",
      input,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "capi_output",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              isImageQuery: { type: "boolean" },
              imageSpec: {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string", enum: ["character_or_object", "background"] },
                  format: { type: "string", enum: ["png_transparent", "jpg"] },
                  prompt: { type: "string" }
                },
                required: ["kind", "format", "prompt"]
              }
            },
            required: ["text", "isImageQuery"]
          }
        }
      }
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": Bearer ${ cc },
      "Content-Type": "application/json"
        },
  body: JSON.stringify(body)
});

const data = await res.json();

// Responses API: output_text trae el texto principal (acá debe ser JSON)
const outText = (data.output_text || "").trim();

let obj;
try {
  obj = JSON.parse(outText);
} catch {
  // fallback si por alguna razón no vino JSON
  obj = { text: outText || "⚠️ Sin respuesta.", isImageQuery: false };
}

// Hard guardrail 200 chars
if (obj.text && obj.text.length > 200) obj.text = obj.text.slice(0, 200);

return obj;

    } catch (err) {
  return { text: "Error: " + (err?.message || "desconocido"), isImageQuery: false };
}
  }

// Ejecutar cada 30s
setInterval(() => {
  if (historialChat && historialChat.length > 0) {
    enviarAAppWeb(historialChat);
  }
}, 30000);

function enviarAAppWeb(historial) {
  if (!historial || historial.length === 0) return;
  const historialString = JSON.stringify({ idConversacion, historial });

  const url = "https://script.google.com/macros/s/AKfycbx6F7DqKUgVVvwTzSe-ViE9jOvucp-qpfidsxMy858ZHt80zQReBiayzAqeR-UK-LQ/exec?historial=" + encodeURIComponent(historialString);

  fetch(url)
    .then(response => response.text())
    .then(result => {
      console.log(result);
      historialChat = [];
    })
    .catch(error => console.error("Error:", error));
}

});