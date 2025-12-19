import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const apiKey = Deno.env.get("GEMINI_API_KEY_AURA");
    if (!apiKey) throw new Error("API Key no encontrada");

    const { 
      imageBase64, 
      secondaryImageBase64, // 👈 Recibimos la segunda imagen
      user_id, 
      feature_id, 
      option1_id, 
      option2_id 
    } = await req.json();

    if (!imageBase64 || !user_id) throw new Error("Faltan datos críticos.");

    // 1. Obtener Prompts de DB
    const idsToFetch = [feature_id];
    if (option1_id) idsToFetch.push(option1_id);
    if (option2_id) idsToFetch.push(option2_id);

    const { data: prompts } = await supabase
      .from('ai_prompts')
      .select('*')
      .in('id', idsToFetch);

    const baseData = prompts?.find(p => p.id === feature_id);
    if (!baseData) throw new Error(`Feature '${feature_id}' no encontrado.`);

    // 2. Cobrar Créditos
    const cost = baseData.cost || 3;
    const { data: transaction, error: txError } = await supabase.rpc('deduct_credits', {
      p_user_id: user_id,
      p_cost: cost
    });

    if (txError || !transaction?.success) {
      return new Response(JSON.stringify({ error: "Saldo insuficiente", code: "INSUFFICIENT_CREDITS" }), {
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Ensamblar Prompt
    let finalPrompt = baseData.system_prompt;
    
    // Si hay opciones extra, agregarlas
    const opt1Prompt = prompts?.find(p => p.id === option1_id)?.system_prompt;
    const opt2Prompt = prompts?.find(p => p.id === option2_id)?.system_prompt;

    if (opt1Prompt) finalPrompt += `\n\n${opt1Prompt}`;
    if (opt2Prompt) finalPrompt += `\n\n${opt2Prompt}`;

    // 4. Preparar contenido para Gemini (Multimodal)
    const contentParts: any[] = [
      finalPrompt,
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ];

    // Si hay segunda imagen (Style Transfer), la agregamos
    if (secondaryImageBase64) {
      console.log("✌️ Modo Dual Image detectado");
      contentParts.push({ 
        inlineData: { data: secondaryImageBase64, mimeType: "image/jpeg" } 
      });
    }

    // 5. Generar
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = baseData.model_id || "gemini-2.5-flash-image";
    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent(contentParts);
    const response = result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (!imagePart) throw new Error("La IA no devolvió imagen.");

    return new Response(JSON.stringify({ 
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});