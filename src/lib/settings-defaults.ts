/** Store settings editable from Admin → Settings. Values here are the defaults written by the seed. */
export const defaultSettings = {
  shipping: {
    freeShippingThreshold: 299,
    /** Charged below the threshold when rateSource is "flat", or when Shiprocket can't quote a rate. */
    flatFee: 49,
    /** "courier": charge the Shiprocket rate for the customer's PIN code and parcel weight. */
    rateSource: "courier" as "courier" | "flat",
    /** Which courier checkout quotes and "Create shipment" books, so the fee charged matches the courier paid. */
    courierChoice: "cheapest" as "cheapest" | "fastest" | "recommended",
  },
  payments: {
    razorpayEnabled: true,
    codEnabled: false,
    codFee: 0,
  },
  fulfilment: {
    /** Push paid orders to Shiprocket automatically instead of waiting for an admin click. */
    autoCreateShipment: false,
    packageLengthCm: 12,
    packageBreadthCm: 10,
    packageHeightCm: 6,
  },
  notifications: {
    adminEmail: "support@dnessentia.com",
    notifyOnNewOrder: true,
  },
  business: {
    legalName: "DN Essentia",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "",
    /** HSN 3303: perfumes and toilet waters. */
    hsn: "3303",
    gstRate: 18,
    invoicePrefix: "DN",
  },
  policies: {
    /** Customers may cancel within this window, before dispatch. */
    cancellationWindowHours: 12,
    /** Share of a prepaid order kept when the customer cancels. */
    cancellationChargePercent: 50,
    /** Days after delivery a replacement can be requested. */
    replacementWindowDays: 3,
    /** Unpaid online orders are cancelled after this many hours. */
    pendingPaymentExpiryHours: 24,
    /** A "complete your payment" reminder is emailed after this many hours. */
    paymentReminderAfterHours: 1,
  },
  store: {
    name: "DN Essentia",
    supportEmail: "support@dnessentia.com",
    supportPhone: "+91 92747 00645",
    lowStockThreshold: 10,
  },
};

export type StoreSettings = typeof defaultSettings;
export type SettingsKey = keyof StoreSettings;
