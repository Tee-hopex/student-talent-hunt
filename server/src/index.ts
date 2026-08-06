import { app } from "./app";
import { env, isProduction } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`Student Talent Hunt API listening on http://localhost:${env.PORT}`);

  if (isProduction && !env.TURNSTILE_SECRET_KEY) {
    console.warn(
      "\n⚠️  TURNSTILE_SECRET_KEY is not set in production — registration, voting, and " +
        "contact forms have no bot protection. Set TURNSTILE_SECRET_KEY (and the client's " +
        "VITE_TURNSTILE_SITE_KEY) once Cloudflare access is available.\n",
    );
  }
});
