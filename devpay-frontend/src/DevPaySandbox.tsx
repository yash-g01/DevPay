import React, { useState, useMemo } from 'react';
import { UPI_APP_TARGETS, UPI_FIELDS } from './types/payment';
import QRCode from 'react-qr-code';
import { 
  Copy, 
  Smartphone, 
  CheckCircle2, 
  Terminal, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  FileCode, 
  Play 
} from 'lucide-react';
import { isIOS, isAndroid } from 'react-device-detect';
import { API_BASE_URL } from './config';

type Platform = 'android' | 'ios';

export const DevPaySandbox: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(() => {
    if (isIOS) return 'ios';
    return 'android';
  });

  const [selectedApp, setSelectedApp] = useState<string>('generic');
  
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    return UPI_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: field.defaultValue }), {});
  });

  const [copied, setCopied] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const regenerateTxnId = () => {
    handleInputChange('tr', 'TXN_' + Math.floor(100000 + Math.random() * 900000));
  };

  // Build the reactive payload URL
  const generatedPayload = useMemo(() => {
    const params = new URLSearchParams();
    if (formData['pa']) params.set('pa', formData['pa'].trim());
    if (formData['pn']) params.set('pn', formData['pn'].trim());
    if (formData['am']) params.set('am', formData['am'].trim());
    params.set('cu', 'INR');
    if (formData['tr']) params.set('tr', formData['tr'].trim());
    if (formData['tn']) params.set('tn', formData['tn'].trim());
    if (formData['mc']) params.set('mc', formData['mc'].trim());

    const queryString = params.toString();
    const baseUPI = `upi://pay?${queryString}`;

    const app = UPI_APP_TARGETS.find((a) => a.id === selectedApp);
    if (!app || app.id === 'generic') {
      return baseUPI;
    }

    if (selectedPlatform === 'android' && app.packageId) {
      return `intent://pay?${queryString}#Intent;scheme=upi;package=${app.packageId};end`;
    } else if (selectedPlatform === 'ios' && app.prefix) {
      return `${app.prefix}://pay?${queryString}`;
    }

    return baseUPI;
  }, [formData, selectedApp, selectedPlatform]);

  const qrCodeURI = useMemo(() => {
    const params = new URLSearchParams();
    if (formData['pa']) params.set('pa', formData['pa'].trim());
    if (formData['pn']) params.set('pn', formData['pn'].trim());
    if (formData['am']) params.set('am', formData['am'].trim());
    params.set('cu', 'INR');
    if (formData['tr']) params.set('tr', formData['tr'].trim());
    if (formData['tn']) params.set('tn', formData['tn'].trim());
    if (formData['mc']) params.set('mc', formData['mc'].trim());
    return `upi://pay?${params.toString()}`;
  }, [formData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. OPEN DEMO IN NEW TAB WITH CURRENT FORM VALUES
  const handleTryDemo = async () => {
    localStorage.setItem('devpay_live_params', JSON.stringify(formData));

    // Save session to DynamoDB via AWS Lambda
    try {
      await fetch(`${API_BASE_URL}/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData['tr'] || `TXN_${Date.now()}`,
          pa: formData['pa'],
          pn: formData['pn'],
          am: formData['am'],
          tn: formData['tn'],
          webhookUrl: formData['webhookUrl'],
        }),
      });
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }

    const params = new URLSearchParams({
      demo: 'true',
      pa: formData['pa'] || '',
      pn: formData['pn'] || '',
      am: formData['am'] || '10.00',
      tr: formData['tr'] || '',
      tn: formData['tn'] || '',
      mc: formData['mc'] || '',
      webhookUrl: formData['webhookUrl'] || '',
    });
    window.open(`/?${params.toString()}`, '_blank');
  };

  // 2. EXPORT CODE PRE-POPULATED WITH CURRENT FORM VALUES
  const downloadGatewayCode = () => {
    const activePa = formData['pa'] || 'merchant@okaxis';
    const activePn = formData['pn'] || 'DevPay Demo Merchant';
    const activeAm = formData['am'] || '10.00';
    const activeTr = formData['tr'] || ('TXN_' + Date.now());
    const activeTn = formData['tn'] || 'DevPay sandbox testing';
    const activeMc = formData['mc'] || '5411';

    const componentTemplate = `import React, { useState, useMemo } from 'react';
import QRCode from 'react-qr-code';

export interface DevPayGatewayProps {
  pa?: string;
  pn?: string;
  am?: string | number;
  tr?: string;
  tn?: string;
  mc?: string;
  onPaymentDone?: () => void;
}

const APPS = [
  { name: 'Amazon Pay', id: 'amazon', packageId: 'in.amazon.mShop.android.shopping', scheme: 'amazonpay', bgColor: 'hover:bg-orange-500/20 hover:border-orange-500' },
  { name: 'Google Pay', id: 'gpay', packageId: 'com.google.android.apps.nbu.paisa.user', scheme: 'gpay', bgColor: 'hover:bg-blue-600/20 hover:border-blue-500' },
  { name: 'PhonePe', id: 'phonepe', packageId: 'com.phonepe.app', scheme: 'phonepe', bgColor: 'hover:bg-purple-600/20 hover:border-purple-500' },
  { name: 'BHIM', id: 'bhim', packageId: 'in.org.npci.upiapp', scheme: 'bhim', bgColor: 'hover:bg-orange-500/20 hover:border-orange-500' },
  { name: 'Paytm', id: 'paytm', packageId: 'net.one97.paytm', scheme: 'paytmmp', bgColor: 'hover:bg-sky-600/20 hover:border-sky-500' },
];

export const DevPayGateway: React.FC<DevPayGatewayProps> = ({
  pa = '${activePa}',
  pn = '${activePn}',
  am = '${activeAm}',
  tr = '${activeTr}',
  tn = '${activeTn}',
  mc = '${activeMc}',
  onPaymentDone,
}) => {
  const ua = typeof window !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;
  const [showQRMobile, setShowQRMobile] = useState(!isMobile);

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({
      pa: pa.trim(),
      pn: pn.trim(),
      am: String(am).trim(),
      cu: 'INR',
      tr: tr.trim(),
      tn: tn.trim(),
    });
    if (mc) params.set('mc', mc.trim());
    return params.toString();
  }, [pa, pn, am, tr, tn, mc]);

  const genericUPI = \`upi://pay?\${baseQuery}\`;

  const getDeepLink = (pkg: string, scheme: string) => {
    if (isAndroid) return \`intent://pay?\${baseQuery}#Intent;scheme=upi;package=\${pkg};end\`;
    if (isIOS) return \`\${scheme}://pay?\${baseQuery}\`;
    return genericUPI;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#16161a] border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h3 className="font-semibold text-lg text-white">Complete Payment</h3>
          <p className="text-xs text-zinc-400">Paying to <span className="text-zinc-200">{pn}</span></p>
          <p className="text-[11px] font-mono text-zinc-500">VPA: {pa}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-400">Amount</span>
          <p className="text-xl font-bold text-orange-500 font-mono">₹{Number(am).toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isMobile && !showQRMobile ? (
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Choose App to Pay</p>
            <div className="grid grid-cols-2 gap-2.5">
              {APPS.map((app) => (
                <a
                  key={app.name}
                  href={getDeepLink(app.packageId, app.scheme)}
                  className="p-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-xl text-center text-sm font-medium transition-all block"
                >
                  {app.name}
                </a>
              ))}
            </div>

            <a
              href={genericUPI}
              className="w-full py-3 mt-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl text-sm flex items-center justify-center transition-all"
            >
              Open Default UPI App
            </a>

            <button
              onClick={() => setShowQRMobile(true)}
              className="w-full text-xs text-center text-zinc-400 hover:text-zinc-200 mt-2 block"
            >
              Want to pay with another phone? Show QR
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <QRCode value={genericUPI} size={180} />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-400">Scan using any UPI app</p>
              <p className="text-[10px] font-mono text-zinc-500">Ref: {tr}</p>
            </div>

            {isMobile && (
              <button
                onClick={() => setShowQRMobile(false)}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium"
              >
                ← Back to App Links
              </button>
            )}
          </div>
        )}

        {onPaymentDone && (
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={onPaymentDone}
              className="w-full py-2 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all"
            >
              I have completed payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* 
// Example usage with your active configuration:
<DevPayGateway 
  pa="${activePa}"
  pn="${activePn}"
  am="${activeAm}"
  tr="${activeTr}"
  tn="${activeTn}"
  mc="${activeMc}"
/>
*/

export default DevPayGateway;
`;

    const blob = new Blob([componentTemplate], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DevPayGateway.tsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-zinc-100 font-sans selection:bg-[#ff5722] selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[#ff5722]/10 blur-[130px] pointer-events-none rounded-full"></div>

      {/* Header */}
      <header className="relative border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-50 bg-[#0e0e10]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff5722] to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff5722]/20">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-lg">Dev<span className="text-[#ff5722]">Pay</span></span>
          </div>
          <div className="text-xs font-mono text-zinc-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main Sandbox */}
      <main className="relative max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Developer-First <span className="bg-gradient-to-r from-[#ff5722] via-orange-400 to-amber-400 bg-clip-text text-transparent">UPI Sandbox</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Generate, customize, and validate mobile-native payment deep links instantly without gateway onboarding or KYC documentation.
          </p>
        </div>

        {/* Playground Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#16161a]/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          
          {/* Left Form: Parameter Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Target Platform Selector */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <label className="text-xs uppercase font-mono tracking-wider text-zinc-400 block">
                  Target Operating System
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {isIOS ? 'Detected: iOS device' : isAndroid ? 'Detected: Android device' : 'Detected: Desktop'}
                </span>
              </div>

              <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg">
                {/* Android Intent Pill */}
                <button
                  type="button"
                  disabled={selectedApp === 'amazon'}
                  onClick={() => setSelectedPlatform('android')}
                  title={selectedApp === 'amazon' ? 'Amazon intent not available for android (We are working on it)' : undefined}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                    selectedApp === 'amazon'
                      ? 'opacity-30 cursor-not-allowed text-zinc-600'
                      : selectedPlatform === 'android'
                      ? 'bg-zinc-800 text-[#ff5722] font-semibold border border-[#ff5722]/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Android Intent
                </button>

                {/* iOS Scheme Pill: Disabled & greyed out if Generic UPI is selected */}
                <button
                  type="button"
                  disabled={selectedApp === 'generic'}
                  onClick={() => setSelectedPlatform('ios')}
                  title={selectedApp === 'generic' ? 'iOS custom scheme not applicable for Generic UPI' : undefined}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                    selectedApp === 'generic'
                      ? 'opacity-30 cursor-not-allowed text-zinc-600'
                      : selectedPlatform === 'ios'
                      ? 'bg-zinc-800 text-[#ff5722] font-semibold border border-[#ff5722]/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  iOS Scheme
                </button>
              </div>
            </div>

            {/* Target App Switcher Pills */}
            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-2.5 block">
                Target App Handler
              </label>
              <div className="flex flex-wrap gap-2">
                {UPI_APP_TARGETS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app.id);
                      // If Generic UPI is selected while on iOS, revert back to Android
                      if (app.id === 'generic' && selectedPlatform === 'ios') {
                        setSelectedPlatform('android');
                      }
                      if (app.id === 'amazon' && selectedPlatform === 'android') {
                        setSelectedPlatform('ios'); // Amazon intent not available for Android, switch to iOS
                      }
                    }}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      selectedApp === app.id
                        ? 'border-[#ff5722] text-white bg-zinc-800 shadow-sm shadow-[#ff5722]/20'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Parameter Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {UPI_FIELDS.map((field) => (
                <div key={field.key} className={field.key === 'tn' ? 'md:col-span-2' : ''}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono text-zinc-400 flex items-center space-x-1">
                      <span>{field.label}</span>
                      <span className="text-[#ff5722]">({field.paramName})</span>
                    </label>
                    {field.key === 'tr' && (
                      <button 
                        type="button" 
                        onClick={regenerateTxnId}
                        className="text-[10px] text-zinc-400 hover:text-[#ff5722] flex items-center space-x-1 font-mono transition-colors"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Regen ID</span>
                      </button>
                    )}
                    {field.required && <span className="text-[10px] text-zinc-500">Required</span>}
                  </div>
                  
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#ff5722] transition-colors font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons: Responsive Order & Styling */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="order-2 sm:order-1 w-full sm:flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all
                  bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300
                  sm:bg-[#ff5722] sm:hover:bg-orange-600 sm:border-transparent sm:text-white sm:shadow-md sm:shadow-[#ff5722]/20"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400 sm:text-emerald-200" /> : <Copy className="w-4 h-4 text-zinc-400 sm:text-white" />}
                <span>{copied ? 'Copied Payload!' : 'Copy Intent Payload'}</span>
              </button>
              
              <a
                href={generatedPayload}
                className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all
                  bg-[#ff5722] hover:bg-orange-600 text-white shadow-md shadow-[#ff5722]/20 border border-transparent
                  sm:bg-zinc-900 sm:hover:bg-zinc-800 sm:border-zinc-800 sm:text-zinc-300 sm:shadow-none"
              >
                <ExternalLink className="w-4 h-4 text-white sm:text-[#ff5722]" />
                <span>Launch Intent</span>
              </a>
            </div>
          </div>

          {/* Right Preview: Live Code & QR (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800/80 lg:pl-6 pt-6 lg:pt-0 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
                  {selectedPlatform === 'android' ? 'Android Intent URI' : 'iOS Custom Scheme URI'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>REACTIVE</span>
                </span>
              </div>
              
              <div className="bg-black/90 rounded-xl p-3 border border-zinc-800 text-xs font-mono break-all text-amber-300 select-all min-h-[85px] leading-relaxed">
                {generatedPayload}
              </div>

              {/* ACTION CARD: TRY DEMO & EXPORT (WITH CURRENT FORM VALUES) */}
              <div className="mt-3 p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-[#ff5722]/10 rounded-lg border border-[#ff5722]/20 text-[#ff5722]">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Demo Gateway Component</div>
                    <div className="text-[10px] font-mono text-zinc-400">Pre-configured with current inputs.</div>
                    <div className="text-[10px] font-mono text-zinc-400">(Open with Mobile to view all options)</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTryDemo}
                    className="px-2.5 py-1.5 rounded-lg bg-[#ff5722]/10 hover:bg-[#ff5722]/20 text-[#ff5722] border border-[#ff5722]/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Try Demo</span>
                    <ExternalLink className="w-3 h-3 text-[#ff5722]/70" />
                  </button>

                  <button
                    type="button"
                    onClick={downloadGatewayCode}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .tsx</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scannable Test QR */}
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
              <div className="p-3 bg-white rounded-lg shadow-xl">
                <QRCode value={qrCodeURI} size={140} />
              </div>
              <span className="text-xs text-zinc-400 mt-3 flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#ff5722]" />
                <span>Scan with any UPI app on phone</span>
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};