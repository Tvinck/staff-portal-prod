export const getDigisellerToken = async () => {
  try {
    const seller_id = Number(import.meta.env.VITE_DIGISELLER_ID);
    const api_key = import.meta.env.VITE_DIGISELLER_API_KEY;
    
    if (!seller_id || !api_key) throw new Error("Digiseller credentials not found in .env");

    const timestamp = Math.floor(Date.now() / 1000);
    const signString = api_key + timestamp;
    
    // Create SHA-256 hash using Web Crypto API
    const msgBuffer = new TextEncoder().encode(signString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await fetch('https://api.digiseller.ru/api/apilogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ seller_id, timestamp, sign })
    });

    const data = await response.json();
    if (data.retval !== 0) throw new Error(data.desc || "Failed to login to Digiseller");
    
    return data.token;
  } catch (error) {
    console.error("Digiseller Token Error:", error);
    throw error;
  }
};

export const getDigisellerSells = async (token, rows = 50) => {
  try {
    const ds = new Date(); ds.setMonth(ds.getMonth() - 2);
    const date_start = ds.toISOString().split('T')[0] + ' 00:00:00';
    const df = new Date();
    const date_finish = df.toISOString().split('T')[0] + ' 23:59:59';
    
    const response = await fetch(`https://api.digiseller.ru/api/seller-sells/v2?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        product_ids: [],
        date_start,
        date_finish,
        returned: 0,
        page: 1,
        rows
      })
    });
    
    const data = await response.json();
    if (data.retval !== 0 && data.retval !== undefined) throw new Error(data.desc || data.retdesc);
    return data;
  } catch (error) {
    console.error("Digiseller Sells Error:", error);
    throw error;
  }
};

export const getDigisellerGoods = async (token, rows = 50) => {
  try {
    const seller_id = Number(import.meta.env.VITE_DIGISELLER_ID);
    
    const response = await fetch(`https://api.digiseller.ru/api/seller-goods?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        id_seller: seller_id, 
        rows,
        page: 1,
        currency: 'USD',
        lang: 'ru-RU',
        show_hidden: 0,
        owner_id: 0
      })
    });
    
    const data = await response.json();
    if (data.retval !== 0 && data.retval !== undefined) throw new Error(data.desc || data.retdesc);
    return data;
  } catch (error) {
    console.error("Digiseller Goods Error:", error);
    throw error;
  }
};

