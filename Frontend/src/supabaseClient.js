import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pgmyfstisjeluzcdzmgj.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbXlmc3Rpc2plbHV6Y2R6bWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTk1NTIsImV4cCI6MjA4NzI5NTU1Mn0.3EpwH7V2_hz3JmpAqLLCQ88REyhKMrsjuKYVlIsNeRE"

export const supabase = createClient(
supabaseUrl,
supabaseAnonKey
)