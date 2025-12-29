import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Diagnóstico de Variables de Entorno
    const sbUrl = Deno.env.get("LYH_SUPABASE_URL");
    const sbKey = Deno.env.get("LYH_SERVICE_ROLE_KEY");
    
    console.log(`🔌 [Init] Conectando a DB. URL Configurada: ${!!sbUrl}, Key Configurada: ${!!sbKey}`);

    const supabase = createClient(sbUrl ?? "", sbKey ?? "");

    const apiKey = Deno.env.get("GEMINI_API_KEY_AURA");
    if (!apiKey) throw new Error("API Key de Gemini no encontrada en secretos.");

    // 2. Parsear el Body y Loguear el Usuario
    const { 
      imageBase64, 
      secondaryImageBase64, 
      user_id, 
      feature_id, 
      option1_id, 
      option2_id 
    } = await req.json();

    console.log(`👤 [Request] User ID recibido: '${user_id}' (Longitud: ${user_id?.length || 0})`);
    console.log(`🎨 [Request] Feature ID: ${feature_id}`);

    if (!imageBase64 || !user_id) throw new Error("Faltan datos críticos (imagen o user_id).");

    // 3. Obtener Prompts de DB
    const idsToFetch = [feature_id];
    if (option1_id) idsToFetch.push(option1_id);
    if (option2_id) idsToFetch.push(option2_id);

    const { data: prompts, error: promptsError } = await supabase
      .from('ai_prompts')
      .select('*')
      .in('id', idsToFetch);

    if (promptsError) {
        console.error("❌ [DB Error] Error al buscar prompts:", JSON.stringify(promptsError));
        throw new Error("Error interno leyendo configuración.");
    }

    const baseData = prompts?.find(p => p.id === feature_id);
    if (!baseData) throw new Error(`Feature '${feature_id}' no encontrado en la DB.`);

    // 4. Cobrar Créditos (DEBUG IMPORTANTE)
    const cost = baseData.cost || 3;
    console.log(`💰 [Cobro] Intentando descontar ${cost} créditos al usuario '${user_id}'...`);

    const { data: transaction, error: txError } = await supabase.rpc('deduct_credits', {
      p_user_id: user_id,
      p_cost: cost
    });

    // --- LOGS DETALLADOS DE LA TRANSACCIÓN ---
    if (txError) {
        console.error("❌ [RPC FAILURE] Error crítico al llamar a deduct_credits:", JSON.stringify(txError));
    } else {
        console.log("📄 [RPC RESULT] Respuesta de la función SQL:", JSON.stringify(transaction));
    }
    // -----------------------------------------

    if (txError || !transaction?.success) {
      return new Response(JSON.stringify({ 
        error: transaction?.error || "Saldo insuficiente o error de transacción", 
        code: "INSUFFICIENT_CREDITS",
        details: transaction 
      }), {
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ [Cobro Exitoso] Nuevo saldo: ${transaction.new_balance}`);

    // =================================================================================
    // 5. Ensamblar Prompt (MODIFICADO PARA NEGATIVE PROMPTS)
    // =================================================================================
    let finalPrompt = baseData.system_prompt;
    
    // Recuperamos los objetos completos de las opciones (si existen)
    const opt1Data = prompts?.find(p => p.id === option1_id);
    const opt2Data = prompts?.find(p => p.id === option2_id);

    // Agregar Prompts Positivos (System Prompts)
    if (opt1Data?.system_prompt) finalPrompt += `\n\n${opt1Data.system_prompt}`;
    if (opt2Data?.system_prompt) finalPrompt += `\n\n${opt2Data.system_prompt}`;

    // --- LÓGICA DE NEGATIVE PROMPTS ---
    const negatives: string[] = [];

    // Validar y agregar negative prompts de cada elemento (si existen y no están vacíos)
    if (baseData.negative_prompt && baseData.negative_prompt.trim() !== "") {
        negatives.push(baseData.negative_prompt.trim());
    }
    if (opt1Data?.negative_prompt && opt1Data.negative_prompt.trim() !== "") {
        negatives.push(opt1Data.negative_prompt.trim());
    }
    if (opt2Data?.negative_prompt && opt2Data.negative_prompt.trim() !== "") {
        negatives.push(opt2Data.negative_prompt.trim());
    }

    // Si encontramos reglas negativas, las agregamos al final con una instrucción fuerte
    if (negatives.length > 0) {
        console.log(`🛡️ [Prompt] Aplicando ${negatives.length} reglas negativas.`);
        finalPrompt += `\n\nIMPORTANT - NEGATIVE CONSTRAINTS (DO NOT INCLUDE THESE ELEMENTS): ${negatives.join(", ")}`;
    }
    // =================================================================================

    // 6. Preparar contenido para Gemini (Multimodal)
    const contentParts: any[] = [
      finalPrompt,
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ];

    // Si hay segunda imagen (Style Transfer), la agregamos
    if (secondaryImageBase64) {
      console.log("✌️ [Gemini] Modo Dual Image activo");
      contentParts.push({ 
        inlineData: { data: secondaryImageBase64, mimeType: "image/jpeg" } 
      });
    }

    // 7. Generar con Gemini
    console.log("🤖 [Gemini] Enviando solicitud a Google...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = baseData.model_id || "gemini-2.5-flash-image";
    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent(contentParts);
    const response = result.response;

    // 👇 [INICIO DEBUGGING] Agrega este bloque
    console.log("🔍 [Gemini Debug] Respuesta completa:", JSON.stringify(response, null, 2));

    const candidate = response.candidates?.[0];

    // 1. Verificar si hubo un bloqueo de seguridad u otra razón de parada
    if (candidate?.finishReason && candidate?.finishReason !== "STOP") {
       console.warn(`⚠️ [Gemini Warning] La generación se detuvo por: ${candidate.finishReason}`);
       if (candidate.safetyRatings) {
         console.warn("🛡️ Safety Ratings:", JSON.stringify(candidate.safetyRatings, null, 2));
       }
       throw new Error(`La IA rechazó la solicitud. Razón: ${candidate.finishReason}`);
    }

    // 2. Intentar obtener la imagen
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

    // 3. Si no hay imagen, buscar si la IA respondió con texto explicativo
    if (!imagePart) {
        const textPart = candidate?.content?.parts?.find((p: any) => p.text);
        if (textPart) {
            console.error("❌ [Gemini Error] La IA respondió texto en vez de imagen:", textPart.text);
            // Esto te dirá exactamente por qué la IA se quejó (ej: "No veo una casa aquí")
            throw new Error(`La IA no generó imagen. Respuesta: "${textPart.text}"`);
        }
        throw new Error("La IA no devolvió imagen ni texto explicativo.");
    }
    // 👆 [FIN DEBUGGING]

    console.log("✨ [Exito] Imagen generada correctamente.");

    return new Response(JSON.stringify({ 
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("🔥 [CRITICAL ERROR]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});