import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentData, columns, model = 'google/gemini-2.5-flash' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create a comprehensive system prompt for data transformation
    const systemPrompt = `You are an expert data transformation assistant. Your job is to:
1. Understand the user's data transformation request
2. Generate SQL-like logic to transform the data
3. Provide clear explanation of what the transformation does
4. Return the transformed data

The current dataset has these columns: ${columns.join(', ')}
There are ${currentData.length} rows in the dataset.

When responding:
- Explain the transformation clearly
- Generate a SQL query that represents the transformation logic
- Apply the transformation to the data and return the result

Respond in this JSON format:
{
  "explanation": "Clear explanation of what was done",
  "sqlQuery": "SQL query representation of the transformation",
  "transformedData": [/* array of transformed data objects */]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current data sample: ${JSON.stringify(currentData.slice(0, 5))}\n\nUser request: ${prompt}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'transform_data',
              description: 'Transform the dataset based on user requirements',
              parameters: {
                type: 'object',
                properties: {
                  explanation: {
                    type: 'string',
                    description: 'Clear explanation of the transformation'
                  },
                  sqlQuery: {
                    type: 'string',
                    description: 'SQL query representation of the transformation'
                  },
                  transformedData: {
                    type: 'array',
                    description: 'The transformed dataset',
                    items: { type: 'object' }
                  }
                },
                required: ['explanation', 'sqlQuery', 'transformedData'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'transform_data' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Data transformation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Transformation failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
