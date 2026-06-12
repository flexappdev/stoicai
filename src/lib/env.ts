function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v.trim();
}
function opt(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export const env = {
  supabaseUrl: () => need("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => need("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => need("SUPABASE_SERVICE_ROLE_KEY"),
  openRouterApiKey: () => need("OPENROUTER_API_KEY"),
  openRouterDefaultModel: () => opt("OPENROUTER_MODEL", "anthropic/claude-sonnet-4-6"),
  anthropicApiKey: () => opt("ANTHROPIC_API_KEY"),
  mongoUri: () => opt("MONGODB_URI"),
  mongoDb: () => opt("MONGODB_DB", "AIDB"),
  s3: () => ({
    region: opt("S3_REGION", "eu-west-2"),
    accessKey: opt("S3_ACCESS_KEY"),
    secretKey: opt("S3_SECRET_ACCESS_KEY"),
    bucket: opt("S3_BUCKET_NAME", "com27"),
    prefix: opt("STOICAI_S3_PREFIX", "stoicai"),
    publicBase: opt("S3_PUBLIC_URL", "https://com27.s3.eu-west-2.amazonaws.com"),
  }),
  runware: () => ({
    base: opt("RUNWARE_API_BASE"),
    key: opt("RUNWARE_API_KEY"),
  }),
  gaId: () => opt("NEXT_PUBLIC_GA_ID"),
  appName: () => opt("NEXT_PUBLIC_APP_NAME", "StoicAI"),
  appPort: () => Number(opt("NEXT_PUBLIC_APP_PORT", "17003")),
};
