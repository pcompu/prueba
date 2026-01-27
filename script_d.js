$(document).ready(async function () {

    let historialChat = [];
    let historialCompleto = [];    // <--- Nuevo: mantiene TODO el contexto para la IA
    const idConversacion = generarIdConversacion();
  
    const $sendButton = $('#sendButton');
    const $messageInput = $('#messageInput');
    const $chatHistory = $('#chatHistory');
  
    let promptBase = "";            
    let archivosContenidos = [];    
  
    const idSheets = '1IiPs77RgCNq6uXE2ezSsvVyRnu2Mk1y8gfUHcyIzaJg';
    const apiKey = 'AIzaSyAVvMA2r0J3skLgWq2g0JX6facQN9BXsXM';
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
        const urlPrompt = `https://content-sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/prompt!A1?access_token=${apiKey}&key=${apiKey}`;
        const resPrompt = await fetch(urlPrompt);
        if (!resPrompt.ok) throw new Error("No se pudo obtener el prompt");
        const datosPrompt = await resPrompt.json();
        promptBase = datosPrompt.values?.[0]?.[0] || "";
        console.log("> Prompt obtenido");
  
        const urlArchivos = `https://content-sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/archivos!B2:B?access_token=${apiKey}&key=${apiKey}`;
        const resArchivos = await fetch(urlArchivos);
        if (!resArchivos.ok) throw new Error("No se pudo obtener los archivos");
        const datosArchivos = await resArchivos.json();
        archivosContenidos = datosArchivos.values?.map(r => r[0]).filter(Boolean) || [];
        console.log("> Archivos obtenidos");
  
      } catch (err) {
        console.error("Error al inicializar el chat:", err);
        $messageInput.prop('disabled', true);
        $sendButton.prop('disabled', true);
        appendMessage("❌ Error, por favor, vuelve a intentarlo.", 'ia');
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
        return data.choices?.[0]?.message?.content || "⚠️ Sin respuesta de la IA";
      } catch (err) {
        return "Error: " + err.message;
      }
    }
  
    $sendButton.on('click', async function () {
      const message = $messageInput.val().trim();
      if (!message) return;
  
      appendMessage(`<strong>Tú:</strong> ${message}`, 'user');  
      $messageInput.val('');
      $messageInput.prop('disabled', true);
      $sendButton.prop('disabled', true).text('Procesando...');
  
      const recentHistory = historialCompleto.slice(-8);  // Ahora tomamos del historial completo
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
  
      historialCompleto.push({ usuario: message, ia: aiResponse }); // <-- Guardamos TODO
      historialChat.push({ usuario: message, ia: aiResponse });      // <-- Historial temporal para envío a WebApp
    });
  
    // --- Guardado automático cada 30 segundos ---
    setInterval(() => {
      if (historialChat && historialChat.length > 0) {
        enviarAAppWeb(historialChat);
      }
    }, 150000); // 2,5 minutos
  
    function enviarAAppWeb(historial) {
      if (!historial || historial.length === 0) return;
      const historialString = JSON.stringify({ idConversacion, historial }); // Incluir ID
  
      const url = "https://script.google.com/macros/s/AKfycbx6F7DqKUgVVvwTzSe-ViE9jOvucp-qpfidsxMy858ZHt80zQReBiayzAqeR-UK-LQ/exec?historial=" 
                  + encodeURIComponent(historialString);
  
      fetch(url)
      .then(response => response.text())
      .then(result => {
        console.log("> Historial enviado");
        historialChat = []; // ✅ Reiniciar historial temporal después de enviar
      }).catch(error => console.error("Error al enviar historial:", error));
    }
  
  });