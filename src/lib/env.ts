import "server-only";

/** Typed access to environment configuration, plus "is this integration set up?" flags for the admin. */
export const env = {
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProd: process.env.NODE_ENV === "production",
  appSecret: process.env.APP_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "DN Essentia <support@dnessentia.com>",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  },

  shiprocket: {
    // Override only to point at Shiprocket's sandbox while testing.
    apiUrl: (process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in/v1/external").replace(/\/$/, ""),
    email: process.env.SHIPROCKET_EMAIL ?? "",
    password: process.env.SHIPROCKET_PASSWORD ?? "",
    // When true, "Create shipment" only creates the order in Shiprocket. It never assigns a courier or books a
    // pickup (the two steps that charge the wallet), so a live API user can be tested safely.
    testOnly: process.env.SHIPROCKET_TEST_ONLY === "true",
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE ?? "",
    webhookToken: process.env.SHIPROCKET_WEBHOOK_TOKEN ?? "",
  },
};

export const integrations = {
  smtp: () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass),
  razorpay: () => Boolean(env.razorpay.keyId && env.razorpay.keySecret),
  razorpayTestMode: () => env.razorpay.keyId.startsWith("rzp_test_"),
  shiprocket: () => Boolean(env.shiprocket.email && env.shiprocket.password),
};
