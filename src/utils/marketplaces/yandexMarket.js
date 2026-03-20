/**
 * Утилита для работы с API Яндекс Маркета (Цифровые товары)
 */
import { supabase } from '../supabase';

const YM_CONFIG_KEY = 'yandex_market_config';

export const getYandexConfig = () => {
  const config = localStorage.getItem(YM_CONFIG_KEY);
  return config ? JSON.parse(config) : {
    campaignId: '148917824',
    oauthToken: 'ACMA:U1ooGyYixvofQngHPzYEKhZIKsEKphgDmvTZGPJ2:4148dedb',
    businessId: '216514292',
    isActive: true
  };
};

export const saveYandexConfig = (config) => {
  localStorage.setItem(YM_CONFIG_KEY, JSON.stringify(config));
};

/**
 * Функция для получения списка товаров из Яндекс Маркета через Edge Function
 */
export const fetchYandexProducts = async () => {
  const config = getYandexConfig();
  
  try {
    const { data, error } = await supabase.functions.invoke('yandex-market-proxy', {
      body: { 
        campaignId: config.campaignId, 
        token: config.oauthToken,
        action: 'getProducts'
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // Маппинг данных из формата Яндекс Маркета в формат UI
    // API возвращает offerMappingEntries
    // Обработка разных форматов ответа (старый и новый API)
    const offers = data.result?.offerMappings || data.result?.offerMappingEntries || [];
    
    return offers.map(item => ({
      sku: item.offer?.shopSku || 'N/A',
      name: item.offer?.name || 'Без названия',
      price: item.offer?.price || 0,
      stock: 0, // В этом эндпоинте остатков обычно нет, нужно запрашивать отдельно
      status: item.mapping?.isApproved ? 'PUBLISHED' : 'DELISTED',
      category: item.offer?.category || 'Цифровой товар'
    }));
  } catch (error) {
    console.error('Yandex API Error:', error);
    throw error;
  }
};

/**
 * Синхронизирует данные из Яндекс Маркета в локальную базу данных Supabase
 */
export const syncProducts = async () => {
  try {
    const products = await fetchYandexProducts();
    
    if (!products || products.length === 0) {
      console.warn('No products found to sync');
      return;
    }

    // Дедупликация по SKU (на случай если в ответе API есть дубли)
    const uniqueProducts = [];
    const seenSkus = new Set();
    
    for (const p of products) {
      if (p.sku && !seenSkus.has(p.sku)) {
        uniqueProducts.push(p);
        seenSkus.add(p.sku);
      }
    }

    // Подготовка данных для Supabase (upsert по полю sku)
    const { error } = await supabase
      .from('market_catalog')
      .upsert(
        uniqueProducts.map(p => ({
          sku: p.sku,
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category
        })),
        { onConflict: 'sku' }
      );

    if (error) throw error;
    
    return { count: uniqueProducts.length };
  } catch (error) {
    console.error('Sync to DB Error:', error);
    throw error;
  }
};

/**
 * Получает список доступных чатов
 */
export const fetchYandexChats = async () => {
  const config = getYandexConfig();
  
  try {
    const { data, error } = await supabase.functions.invoke('yandex-market-proxy', {
      body: { 
        businessId: config.businessId,
        token: config.oauthToken,
        action: 'getChats'
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data.result?.chats || [];
  } catch (error) {
    console.error('Yandex Chats Fetch Error:', error);
    throw error;
  }
};

/**
 * Получает историю сообщений для конкретного чата
 */
export const fetchChatHistory = async (chatId) => {
  const config = getYandexConfig();
  
  try {
    const { data, error } = await supabase.functions.invoke('yandex-market-proxy', {
      body: { 
        businessId: config.businessId,
        token: config.oauthToken,
        action: 'getChatHistory',
        chatId
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data.result?.messages || [];
  } catch (error) {
    console.error('Yandex Chat History Error:', error);
    throw error;
  }
};

/**
 * Отправляет сообщение в чат
 */
export const sendChatMessage = async (chatId, text) => {
  const config = getYandexConfig();
  
  try {
    const { data, error } = await supabase.functions.invoke('yandex-market-proxy', {
      body: { 
        businessId: config.businessId,
        token: config.oauthToken,
        action: 'sendMessage',
        chatId,
        message: text
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data.result;
  } catch (error) {
    console.error('Yandex Send Message Error:', error);
    throw error;
  }
};
