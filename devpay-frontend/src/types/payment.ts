export interface AppHandler {
  id: string;
  name: string;
  packageId?: string; // Android package target
  prefix?: string; //iOS App Prefix
}

export interface UPIField {
  key: string;
  label: string;
  paramName: string;
  placeholder: string;
  defaultValue: string;
  required: boolean;
  type: 'text' | 'number';
}

export const UPI_APP_TARGETS: AppHandler[] = [
  { id: 'generic', name: 'Generic UPI' },
  { id: 'amazon', name: 'Amazon Pay', packageId: 'in.amazon.mShop.android.shopping', prefix: 'amazonpay' },
  { id: 'gpay', name: 'Google Pay', packageId: 'com.google.android.apps.nbu.paisa.user', prefix: 'gpay' },
  { id: 'phonepe', name: 'PhonePe', packageId: 'com.phonepe.app', prefix: 'phonepe' },
  { id: 'bhim', name: 'BHIM', packageId: 'in.org.npci.upiapp', prefix: 'bhim' },
  { id: 'paytm', name: 'Paytm', packageId: 'net.one97.paytm', prefix: 'paytmmp' },
];

export const UPI_FIELDS: UPIField[] = [
  { key: 'pa', label: 'Payee VPA', paramName: 'pa', placeholder: 'merchant@okaxis', defaultValue: 'merchant@okaxis', required: true, type: 'text' },
  { key: 'pn', label: 'Payee Name', paramName: 'pn', placeholder: 'DevPay Store', defaultValue: 'DevPay Demo Merchant', required: true, type: 'text' },
  { key: 'am', label: 'Amount (INR)', paramName: 'am', placeholder: '10.00', defaultValue: '10.00', required: true, type: 'number' },
  { key: 'tr', label: 'Txn Ref ID', paramName: 'tr', placeholder: 'TXN_123456', defaultValue: 'TXN_' + Math.floor(100000 + Math.random() * 900000), required: false, type: 'text' },
  { key: 'tn', label: 'Transaction Note', paramName: 'tn', placeholder: 'Payment for order', defaultValue: 'DevPay sandbox testing', required: false, type: 'text' },
  { key: 'mc', label: 'Merchant Category Code', paramName: 'mc', placeholder: '5411', defaultValue: '5411', required: false, type: 'text' },
  { key: 'webhookUrl', label: 'Callback / Webhook URL', paramName: 'webhook', placeholder: 'https://webhook.site/...', defaultValue: 'https://httpbin.org/post', required: false, type: 'text' },
];