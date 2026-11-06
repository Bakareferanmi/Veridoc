declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    VERIDOC_AUTH_MODE?: string;
    VERIDOC_ADMIN_USER_ID?: string;
    BETTER_AUTH_SECRET?: string;
    APP_ORIGIN?: string;
  }
}
