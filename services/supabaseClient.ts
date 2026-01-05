import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://libcgvamzfkuhfexxfgz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYmNndmFtemZrdWhmZXh4Zmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjc5NDAsImV4cCI6MjA4MzEwMzk0MH0.IONJmi_R5xgamcbj-qL9kWO_-7DV6_0ofQ1TFEXMxf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
