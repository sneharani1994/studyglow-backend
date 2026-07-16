// Polyfill global WebSocket for Node.js versions lacking global WebSocket support
// This prevents the Supabase Client from crashing during initialization, as we do not use realtime sockets.
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class { };
}

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl ? rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '') : undefined;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Service Role Key Loaded:", !!supabaseServiceKey);
console.log("Service Role Key Prefix:", supabaseServiceKey?.substring(0, 15));

if (!supabaseUrl) {
  console.warn('WARNING: SUPABASE_URL is not set in environment variables.');
}

// Client for general public/anon operations or scoped user requests
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Admin client for operations that bypass Row Level Security (e.g. creating/deleting users programmatically, seeding data)
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = {
  supabase,
  supabaseAdmin
};
