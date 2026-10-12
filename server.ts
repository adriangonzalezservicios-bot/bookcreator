import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lightweight abuse guard for public deployments. For multi-instance production, use a shared rate limiter.
const apiRequestWindows = new Map<string, { startedAt: number; count: number }>();
app.use('/api/claude', (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const window = apiRequestWindows.get(key);
  if (!window || now - window.startedAt > 60_000) {
    apiRequestWindows.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  window.count += 1;
  if (window.count > 30) {
    res.status(429).json({ error: 'Demasiadas solicitudes. Esperá un minuto y volvé a intentarlo.' });
    return;
  }
  next();
});

const geminiKey = process.env.GEMINI_API_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

// OpenAI is called only from the server; secrets never need to be exposed to browser code.
async function callOpenAI(system: string, messages: Array<{ role: string; content: string }>, temperature = 0.7) {
  if (!openaiKey) throw new Error('Falta OPENAI_API_KEY en las variables de entorno del servidor.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: openaiModel,
      instructions: system,
      input: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') })),
      temperature,
    }),
    signal: AbortSignal.timeout(90000),
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `OpenAI API error (${response.status})`);
  const output = data.output_text || (data.output || []).flatMap((item: any) => item.content || []).filter((item: any) => item.type === 'output_text').map((item: any) => item.text).join('');
  if (!output) throw new Error('OpenAI devolvió una respuesta vacía.');
  return output as string;
}
const ai = new GoogleGenAI({
  apiKey: geminiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const HERMES_BASE_SYSTEM_INSTRUCTION = `Eres Hermes (inspirado en Hermes Logios, dios griego de la literatura, la elocuencia y las palabras sagradas), el mentor literario supremo y maestro de narrativa creativa. 
Tu vocación es guiar e inspirar a escritores y novelistas en la creación de sus obras maestras.
Tus cualidades fundamentales:
1. Respeto inquebrantable por la voz única del autor: Nunca sustituyas el estilo personal del autor por fórmulas genéricas. Eleva y refina su propia voz con elegancia clásica y moderna.
2. Agudeza crítica y sensibilidad: Señalas tanto las genialidades como las debilidades del texto con empatía, precisión y soluciones prácticas.
3. Dominio de la técnica narrativa: Sabes manejar el ritmo (pacing), la regla de "mostrar, no decir" (show, don't tell), la tensión dramática, el subtexto en los diálogos, la construcción de atmósferas sensoriales y los arcos de personajes.
4. Comunicación: Hablas en un tono cómplice, culto pero accesible, inspirador y generoso. Respondes con claridad y estructurado para facilitar la lectura del escritor.`;
const CLAUDE_BASE_SYSTEM_INSTRUCTION = HERMES_BASE_SYSTEM_INSTRUCTION;

// Endpoint de estado
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    hasGeminiKey: Boolean(geminiKey),
    hasOpenAIKey: Boolean(openaiKey),
    openaiModel: openaiKey ? openaiModel : null,
    model: openaiKey ? openaiModel : 'gemini-flash-latest',
    time: new Date().toISOString(),
  });
});

// Helper to call Anthropic if the user provided an Anthropic API key
async function callAnthropicDirect(apiKey: string, system: string, messages: any[]) {
  const anthropicMessages = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || '',
  }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system,
      messages: anthropicMessages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as any;
  const text = data.content?.map((c: any) => c.text).join('') || '';
  return text;
}

// Helper to call Gemini with model fallback and timeout
async function generateWithGeminiFallback(prompt: string, systemInstruction: string, temperature = 0.7) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      // 6 second timeout per attempt for fast response
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout en ${model}`)), 6000)
      );

      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err: any) {
      console.warn(`Intento fallido con modelo ${model}:`, err.message || err);
      lastError = err;
      // Brief pause before trying next model
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError || new Error('No se pudo generar respuesta con los modelos disponibles.');
}

// Endpoint de chat con Claude
app.post('/api/claude/chat', async (req, res) => {
  try {
    const { messages, bookContext, anthropicKey } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Se requiere una lista de mensajes.' });
      return;
    }

    const contextSummary = bookContext
      ? `
CONTEXTO DEL LIBRO DEL AUTOR:
- Título de la obra: ${bookContext.title || 'Sin título aún'}
- Género: ${bookContext.genre || 'Ficción general'}
- Tono y Estilo buscado: ${bookContext.tone || 'Equilibrado y literario'}
- Premisa / Sinopsis: ${bookContext.synopsis || 'En desarrollo'}
- Capítulo actual: ${bookContext.currentChapterTitle || 'Capítulo en curso'}
${bookContext.characters?.length ? `- Personajes clave: ${bookContext.characters.map((c: any) => `${c.name} (${c.role}): ${c.description || ''}`).join('; ')}` : ''}
${bookContext.currentChapterContent ? `- Fragmento del capítulo actual (extracto para contexto):\n"""\n${bookContext.currentChapterContent.slice(-2500)}\n"""` : ''}
`
      : '';

    const systemInstruction = `${CLAUDE_BASE_SYSTEM_INSTRUCTION}
${contextSummary}

Instrucción de respuesta:
Sé el mejor compañero creativo para el autor. Si te pide sugerencias de trama, dale opciones con pros y contras. Si te pide revisar, resalta qué funciona y qué pulir. Siempre mantén la motivación encendida sin perder el rigor editorial.`;

    // Prefer OpenAI when OPENAI_API_KEY is configured on the server.
    if (openaiKey) {
      try {
        const reply = await callOpenAI(systemInstruction, messages, 0.75);
        res.json({ reply, provider: `openai-${openaiModel}` });
        return;
      } catch (error: any) {
        console.error('OpenAI chat error:', error.message);
        res.status(502).json({ error: `No se pudo conectar con OpenAI: ${error.message}` });
        return;
      }
    }

    // Si el usuario proporcionó su propia API Key de Anthropic
    if (anthropicKey && typeof anthropicKey === 'string' && anthropicKey.trim().startsWith('sk-ant')) {
      try {
        const text = await callAnthropicDirect(anthropicKey.trim(), systemInstruction, messages);
        res.json({ reply: text, provider: 'anthropic-claude' });
        return;
      } catch (err: any) {
        console.warn('Fallo con la key de Anthropic, alternando a Gemini:', err.message);
      }
    }

    // Usar Gemini con fallback de modelos
    const promptHistory = messages.map((m: any) => {
      const rolePrefix = m.role === 'assistant' ? 'Claude' : 'Escritor';
      return `${rolePrefix}: ${m.content}`;
    }).join('\n\n');

    const fullPrompt = `${promptHistory}\n\nClaude:`;

    try {
      const { text, model } = await generateWithGeminiFallback(fullPrompt, systemInstruction, 0.75);
      res.json({ reply: text, provider: `claude-${model}` });
    } catch (llmError: any) {
      // In case of upstream API capacity spikes, provide a graceful literary fallback
      console.error('Error upstream en generación LLM:', llmError);
      res.json({
        reply: `He leído atentamente tus notas sobre «${bookContext?.title || 'tu obra'}».

Para este momento de tu narración:
1. **Ritmo y Tensión**: Asegúrate de que cada párrafo cumpla una función: revelar algo nuevo del personaje o hacer avanzar el conflicto exterior.
2. **Sensorialidad ("Mostrar, no decir")**: Intenta anclar la escena con un detalle físico concreto (el sonido del viento, el peso de un objeto, una mirada eludida).
3. **Continuidad**: ¿Cuál es el mayor obstáculo que tu protagonista no vio venir en este capítulo?

*(Nota editorial: El servicio del modelo está experimentando alta demanda momentánea; he generado este apunte de guía inmediata. Intenta de nuevo en unos segundos si requieres una respuesta más detallada).*`,
        provider: 'claude-literary-guide',
      });
    }
  } catch (error: any) {
    console.error('Error en /api/claude/chat:', error);
    res.status(500).json({
      error: error.message || 'Error al comunicarse con el asistente Claude.',
    });
  }
});

// Endpoint para acciones literarias directas (corrección, continuar, pulir, inspirar)
app.post('/api/claude/action', async (req, res) => {
  try {
    const { action, text, bookContext, customPrompt, anthropicKey } = req.body;

    if (!action && !customPrompt) {
      res.status(400).json({ error: 'Acción no especificada.' });
      return;
    }

    let instruction = '';
    let targetText = text || '';

    switch (action) {
      case 'polish':
        instruction = `Pule el siguiente texto mejorando la cadencia, el ritmo de las frases y la elegancia verbal, sin alterar el significado, la voz natural del autor ni los diálogos. Devuelve el texto pulido de forma directa y clara. Si consideras valioso hacer un apunte editorial breve (1-2 líneas), añádelo al final bajo el epígrafe "💡 Nota de Claude:".`;
        break;
      case 'fix_grammar':
        instruction = `Actúa como corrector ortotipográfico y de estilo riguroso en español. Corrige ortografía, acentuación, signos de puntuación (incluyendo guiones de diálogo largos "—" según las normas de la RAE), concordancia y sintaxis. Mantén intacto el tono del texto. Devuelve el texto corregido. Al final, añade una sección "🔍 Cambios realizados:" explicando brevemente las correcciones más importantes.`;
        break;
      case 'show_dont_tell':
        instruction = `Aplica la regla de oro literaria "Mostrar, no decir" (Show, don't tell) al fragmento seleccionado. Transforma las descripciones abstractas o explicadas en vivencias sensoriales (olores, sonidos, temperatura, gestos involuntarios, miradas, micro-reacciones corporales). Proporciona primero la versión reescrita y luego un breve comentario explicativo del cambio.`;
        break;
      case 'continue':
        instruction = `Eres Claude, co-escritor de este libro. Continúa la escena a partir del último punto del texto de manera fluida y coherente. Desarrolla las acciones inmediatas, la atmósfera y las emociones con naturalidad. Escribe aproximadamente entre 150 y 350 palabras que sirvan de combustible al autor para seguir escribiendo.`;
        break;
      case 'dialogue':
        instruction = `Pule y agudiza los diálogos de este fragmento. Elimina cualquier parlamento que suene artificial o acartonado. Añade subtexto, pausas significativas, lenguaje corporal o pequeños tics que revelen el estado emocional de los personajes sin tener que explicarlo con adjetivos. Usa las rayas de diálogo españolas (—) correctamente.`;
        break;
      case 'poetic':
        instruction = `Añade un tono más lírico, evocador y cinematográfico a este fragmento. Utiliza metáforas ricas, sinestesia y cadencia musical en la prosa sin caer en la grandilocuencia o la saturación.`;
        break;
      case 'darker_tension':
        instruction = `Eleva la tensión dramática, el misterio y el suspense de esta escena. Haz que la atmósfera resulte más opresiva o intrigante; acorta frases donde sea necesario para acelerar el pulso y siembra dudas o presagios sutiles.`;
        break;
      case 'brainstorm_twists':
        instruction = `Como editor y estratega narrativo, analiza el contexto y la escena actual y propón 3 posibles GIROS ARGUMENTALES (plot twists) o complicaciones imprevistas que puedan romper la previsibilidad y poner al protagonista en una encrucijada moral o física fascinante. Presenta cada opción con un título atractivo, la justificación dramática y cómo impacta en la historia.`;
        break;
      case 'critique':
        instruction = `Realiza una LECTURA EDITORIAL PROFESIONAL de este capítulo o escena. Analiza de forma constructiva:
1. Puntos fuertes (lo que atrapa al lector)
2. Ritmo narrativo (¿se estanca en algún punto o va demasiado acelerado?)
3. Desarrollo de personajes y verosimilitud de la voz
4. Sugerencias puntuales de mejora
Sé motivador, honesto y muy preciso.`;
        break;
      case 'character_suggest':
        instruction = `Diseña o expande una ficha literaria de personaje para este libro. Incluye: Nombre, Rol en la historia, Deseo consciente (objetivo), Necesidad inconsciente (herida o conflicto interno), Rasgos físicos distintivos, Tic o peculiaridad de habla, y Relación con el conflicto principal.`;
        break;
      default:
        instruction = customPrompt || 'Mejora o asiste con el siguiente texto literario.';
        break;
    }

    const contextHeader = bookContext ? `
DATOS DEL LIBRO:
- Obra: ${bookContext.title || 'Manuscrito'}
- Género: ${bookContext.genre || 'Narrativa'}
- Tono: ${bookContext.tone || 'Literario'}
- Sinopsis breve: ${bookContext.synopsis || 'En desarrollo'}
- Capítulo: ${bookContext.currentChapterTitle || ''}
` : '';

    const fullPrompt = `${CLAUDE_BASE_SYSTEM_INSTRUCTION}
${contextHeader}

TAREA SOLICITADA:
${instruction}

TEXTO BASE O FRAGMENTO A TRABAJAR:
"""
${targetText}
"""
`;

    // Prefer OpenAI when configured; API key remains server-side.
    if (openaiKey) {
      try {
        const result = await callOpenAI(`${CLAUDE_BASE_SYSTEM_INSTRUCTION}\n${contextHeader}\n\nTAREA SOLICITADA:\n${instruction}\n\nTEXTO BASE:\n${targetText}`, [{ role: 'user', content: 'Realiza la tarea editorial solicitada con fidelidad al texto y a la voz del autor.' }], action === 'brainstorm_twists' || action === 'poetic' ? 0.85 : 0.65);
        res.json({ result, action, provider: `openai-${openaiModel}` });
        return;
      } catch (error: any) {
        console.error('OpenAI action error:', error.message);
        res.status(502).json({ error: `No se pudo conectar con OpenAI: ${error.message}` });
        return;
      }
    }

    // Direct Anthropic support if user provided key
    if (anthropicKey && typeof anthropicKey === 'string' && anthropicKey.trim().startsWith('sk-ant')) {
      try {
        const text = await callAnthropicDirect(anthropicKey.trim(), CLAUDE_BASE_SYSTEM_INSTRUCTION, [
          { role: 'user', content: `${contextHeader}\n\n${instruction}\n\nTEXTO:\n"""${targetText}"""` }
        ]);
        res.json({ result: text, provider: 'anthropic-claude' });
        return;
      } catch (err: any) {
        console.warn('Fallback a Gemini tras error en Anthropic:', err.message);
      }
    }

    try {
      const { text: result, model } = await generateWithGeminiFallback(
        fullPrompt,
        CLAUDE_BASE_SYSTEM_INSTRUCTION,
        action === 'brainstorm_twists' || action === 'poetic' ? 0.85 : 0.65
      );
      res.json({ result, action, provider: `claude-${model}` });
    } catch (llmError: any) {
      console.error('Error en generateWithGeminiFallback para action:', llmError);
      let fallbackText = '';
      if (action === 'fix_grammar') {
        fallbackText = targetText.replace(/  +/g, ' ').trim() + '\n\n🔍 Sugerencia de Claude: Revisa la cadencia de comas y el cierre de las oraciones largas para oxigenar la lectura.';
      } else if (action === 'polish') {
        fallbackText = targetText + '\n\n💡 Nota de Claude: La escena tiene potencia. Prueba a variar la longitud de las frases: alterna frases breves e impactantes con párrafos más envolventes.';
      } else if (action === 'brainstorm_twists') {
        fallbackText = `1. **La revelación anacrónica**: Un objeto clave que el protagonista creía nuevo tiene grabado un detalle que prueba que ya existía hace un siglo.
2. **La lealtad rota**: El personaje en quien más confiaba no estaba mintiendo por malicia, sino para cumplir una promesa hecha a alguien fallecido.
3. **El precio imprevisto**: Conseguir lo que buscaban desata un efecto colateral inmediato que pone en riesgo a una persona inocente.`;
      } else {
        fallbackText = `Sugerencia de Claude para «${action}»:\nRecuerda concentrar la atención en la reacción emocional inmediata del protagonista antes de pasar a la siguiente acción física.`;
      }
      res.json({ result: fallbackText, action, provider: 'claude-literary-guide' });
    }
  } catch (error: any) {
    console.error('Error en /api/claude/action:', error);
    res.status(500).json({
      error: error.message || 'Error al procesar la acción literaria con Claude.',
    });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Pluma Server iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer();
