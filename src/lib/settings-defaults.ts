/** Store settings editable from Admin → Settings. Values here are the defaults written by the seed. */
export const defaultSettings = {
  shipping: {
    freeShippingThreshold: 299,
    flatFee: 49,
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
  store: {
    name: "DN Essentia",
    supportEmail: "support@dnessentia.com",
    supportPhone: "+91 92747 00645",
    lowStockThreshold: 10,
  },
};

export type StoreSettings = typeof defaultSettings;
export type SettingsKey = keyof StoreSettings;
