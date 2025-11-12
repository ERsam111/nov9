import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { executeDataTransformation } from "./transformations.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context, model = "google/gemini-2.5-flash", action, transformationPlan, currentData } = await req.json();
    
    // Handle transformation execution
    if (action === 'executeTransformation' && transformationPlan && currentData) {
      console.log("Executing transformation with plan:", transformationPlan);
      console.log("Current data:", { historicalDataCount: currentData.historicalData?.length });
      
      try {
        const updatedData = executeDataTransformation(transformationPlan, currentData);
        
        console.log("Transformation complete. Updated data:", {
          historicalDataCount: updatedData.historicalData?.length
        });
        
        return new Response(
          JSON.stringify({ updatedData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error("Transformation error:", error);
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : 'Transformation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Handle transformation plan generation
    if (action === 'generateTransformationPlan') {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("Lovable API key is not configured");
      }

      console.log("Generating transformation plan for:", question);
      
      const planPrompt = `You are a data transformation specialist. Generate a transformation plan for forecasting historical data.

AVAILABLE TABLE:
- historicalData: Contains date, demand, customer, product fields

USER REQUEST: ${question}

Generate a JSON transformation plan with this structure:
{
  "description": "Brief description of what will change",
  "operations": [
    { "type": "UPDATE", "details": "UPDATE historicalData SET demand = demand * 1.5" }
  ],
  "affectedData": ["historicalData"]
}

Use SQL UPDATE syntax. Support:
- UPDATE historicalData SET demand = 100
- UPDATE historicalData SET demand = demand * 2
- UPDATE historicalData SET demand = demand + 50 WHERE product = 'ProductA'

Return ONLY valid JSON, no other text.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: planPrompt }],
          max_completion_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const planText = data.choices[0].message.content;
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(planText);

      return new Response(
        JSON.stringify({ plan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key is not configured");
    }

    console.log("Processing forecasting question:", question);
    console.log("Using model:", model);
    console.log("Context provided:", context.comprehensiveContext ? "Yes" : "No");

    const systemPrompt = `You are an expert demand forecasting assistant with deep knowledge of statistical and machine learning forecasting models.

${context.comprehensiveContext || ''}

Your responsibilities:
✓ Answer questions about historical demand data (dates, customers, products, demand patterns)
✓ Explain forecasting model results and accuracy metrics (MAPE, predictions)
✓ Help users understand model parameters and their significance
✓ Provide insights about data quality, outliers, and missing data
✓ Suggest improvements to forecasting accuracy
✓ Compare different forecasting models and recommend the best approach

CRITICAL RULES:
1. Use ONLY the data provided in the context above
2. DO NOT make up or hallucinate data
3. When asked for counts, dates, or statistics, cite the exact values from the context
4. If information is not in the context, clearly state that
5. Format responses clearly with bullet points or tables when appropriate
6. Always explain technical concepts in simple terms

When discussing models:
- Moving Average: Simple, good for stable demand
- Exponential Smoothing: Adapts to recent changes
- Holt-Winters: Handles seasonality and trends
- ARIMA: Statistical method for complex patterns
- Random Forest: Machine learning for non-linear patterns

Always provide actionable insights based on the actual data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    console.log("Generated answer successfully");

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in forecasting-data-support function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
