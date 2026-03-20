import { supabase } from './supabase';

/**
 * DesslyHub API Client — Full-featured integration.
 * 
 * Endpoints covered:
 * ─ Balance: GET /merchants/balance
 * ─ Transactions: GET /merchants/transactions?page=N
 * ─ Steam Top-Up: POST /service/steamtopup/check_login, POST /service/steamtopup/topup
 * ─ Steam Gift: POST /service/steamgift/send (NEW)
 * ─ Mobile Refill: POST /service/mobile/refill, GET /service/mobile/operators (NEW)
 * ─ Voucher: GET /service/voucher/products, GET /service/voucher/{id}, POST /service/voucher/buy
 * ─ Exchange Rates: GET /exchange_rate/steam/{currency}
 * 
 * API Docs: https://desslyhub.readme.io/reference/introduction
 */
const DESSLY_API_KEY = import.meta.env.VITE_DESSLY_API_KEY;
const BASE_URL = '/api_dessly/api/v1';

const headers = {
  'apikey': DESSLY_API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Generic request wrapper with error handling & response parsing.
 */
const desslyRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers,
      ...options
    });
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.warn(`DesslyHub API [${response.status}] ${endpoint}:`, data);
      return { error: true, status: response.status, message: data.message || data.error || `HTTP ${response.status}`, data };
    }
    
    return data;
  } catch (error) {
    console.error(`DesslyHub API Error [${endpoint}]:`, error);
    return { error: true, message: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════
// BALANCE
// ═══════════════════════════════════════════════════════════════

/** Get merchant balance */
export const getDesslyBalance = () => desslyRequest('/merchants/balance');

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════

/** Get paginated merchant transactions */
export const getDesslyTransactions = (page = 1) => 
  desslyRequest(`/merchants/transactions?page=${page}`);

/** Get single transaction by ID */
export const getTransactionById = (txId) => 
  desslyRequest(`/merchants/transactions/${txId}`);

// ═══════════════════════════════════════════════════════════════
// STEAM TOP-UP
// ═══════════════════════════════════════════════════════════════

/** Pre-validate Steam account for top-up eligibility */
export const checkSteamLogin = (username, amount) => 
  desslyRequest('/service/steamtopup/check_login', {
    method: 'POST',
    body: JSON.stringify({ username, amount })
  });

/** Execute Steam wallet top-up */
export const topupSteam = (username, amount, reference) => 
  desslyRequest('/service/steamtopup/topup', {
    method: 'POST',
    body: JSON.stringify({ username, amount, reference })
  });

// ═══════════════════════════════════════════════════════════════
// STEAM GIFT
// ═══════════════════════════════════════════════════════════════

/** Send a Steam gift to a user */
export const sendSteamGift = (steamId, gameId, reference) => 
  desslyRequest('/service/steamgift/send', {
    method: 'POST',
    body: JSON.stringify({ steam_id: steamId, game_id: gameId, reference })
  });

/** Get available Steam games for gifting */
export const getSteamGiftCatalog = () => 
  desslyRequest('/service/steamgift/products');

// ═══════════════════════════════════════════════════════════════
// MOBILE REFILL
// ═══════════════════════════════════════════════════════════════

/** Get available mobile operators */
export const getMobileOperators = () => 
  desslyRequest('/service/mobile/operators');

/** Execute mobile phone refill */
export const refillMobile = (phone, amount, operatorId, reference) => 
  desslyRequest('/service/mobile/refill', {
    method: 'POST',
    body: JSON.stringify({ phone, amount, operator_id: operatorId, reference })
  });

// ═══════════════════════════════════════════════════════════════
// VOUCHERS
// ═══════════════════════════════════════════════════════════════

/** Get all voucher products */
export const getVoucherProducts = () => 
  desslyRequest('/service/voucher/products');

/** Get voucher details by ID */
export const getVoucherById = (id) => 
  desslyRequest(`/service/voucher/${id}`);

/** Purchase a voucher */
export const buyVoucher = (root_id, variant_id) => 
  desslyRequest('/service/voucher/buy', {
    method: 'POST',
    body: JSON.stringify({ root_id, variant_id })
  });

// ═══════════════════════════════════════════════════════════════
// EXCHANGE RATES
// ═══════════════════════════════════════════════════════════════

/** Fetch Steam exchange rate for a given currency */
export const getSteamExchangeRate = async (currencyCode) => {
  const code = currencyCode.toUpperCase();
  return desslyRequest(`/exchange_rate/steam/${code}`);
};

/** Batch-fetch all relevant exchange rates */
export const getAllExchangeRates = async () => {
  const currencies = ['RUB', 'KZT', 'TRY', 'UAH', 'BYN'];
  const results = {};
  
  await Promise.allSettled(
    currencies.map(async (cur) => {
      const data = await getSteamExchangeRate(cur);
      results[cur] = data.error ? null : data.rate || data.value;
    })
  );
  
  return results;
};

// ═══════════════════════════════════════════════════════════════
// SYNC — Supabase Bridge
// ═══════════════════════════════════════════════════════════════

/**
 * Sync DesslyHub transactions into Supabase for local audit.
 * Uses upsert to prevent duplicates.
 */
export const syncDesslyTransactions = async (maxPages = 1) => {
  let totals = { added: 0, errors: 0 };

  try {
    for (let p = 1; p <= maxPages; p++) {
      const data = await getDesslyTransactions(p);
      if (!data.transactions || data.transactions.length === 0) break;

      const formattedTxs = data.transactions.map(tx => ({
        transaction_uuid: tx.transaction_uuid || tx.id,
        service_type: tx.service_name || 'Generic',
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        username: tx.username || tx.receiver || '',
        description: tx.description || '',
        metadata: tx,
        created_at: tx.created_at || new Date().toISOString()
      }));

      const { error: upsertError } = await supabase
        .from('dessly_transactions')
        .upsert(formattedTxs, { onConflict: 'transaction_uuid' });

      if (upsertError) {
        console.error(`Supabase Upsert Error (Page ${p}):`, upsertError);
        totals.errors++;
      } else {
        totals.added += formattedTxs.length;
      }
    }

    // Log sync attempt
    await supabase.from('dessly_sync_logs').insert({
      action: 'sync_transactions',
      status: totals.errors === 0 ? 'success' : 'partial_error',
      response_data: totals
    }).catch(() => {}); // Non-critical

    return totals;
  } catch (error) {
    console.error('Transaction Sync Failed:', error);
    throw error;
  }
};
