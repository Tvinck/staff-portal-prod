import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // Digiseller webhook content-type is typically application/x-www-form-urlencoded
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      payload = await req.json();
    }

    console.log("Received Digiseller webhook:", payload);

    const { inv, id_goods, amount, email, sign } = payload;
    
    // Log invalid empty requests
    if (!inv && !id_goods) {
       return new Response(JSON.stringify({ retval: 1, desc: 'Empty webhook payload' }), { status: 400 });
    }

    // Insert into market_orders
    const { data: orderData, error: orderError } = await supabase
      .from('market_orders')
      .insert([
        { 
          market_name: 'digiseller',
          order_id: inv ? String(inv) : `ds_${Date.now()}`,
          product_name: `Товар ID: ${id_goods}`,
          product_price: parseFloat(amount || "0"),
          customer_email: email || 'No Email',
          status: 'completed',
          metadata: payload
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Failed to insert market_order:", orderError);
      // Suppress duplicates gracefully (unique constraint on market_name + order_id)
      if (orderError.code !== '23505') {
        throw orderError;
      }
    }

    // Register Finance Transaction if not a duplicate
    if (!orderError && amount && parseFloat(amount) > 0) {
      await supabase
        .from('transactions')
        .insert([
          {
            type: 'income',
            amount: parseFloat(amount),
            currency: 'USD',
            category: 'Sales',
            description: `Продажа Digiseller #${inv} (Товар: ${id_goods})`,
            date: new Date().toISOString()
          }
        ]);
    }

    // Digiseller expects retval: 0 for success
    return new Response(JSON.stringify({ retval: 0, desc: 'Success' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({ retval: 1, desc: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
