import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Terminal, CheckCircle2, XCircle, Smartphone, ArrowLeft, ShieldCheck, Loader2, QrCode as QrIcon, Radio, AlertTriangle } from 'lucide-react';
import { isIOS, isAndroid } from 'react-device-detect';
import { API_BASE_URL } from './config';

interface GatewayProps {
  pa: string;
  pn: string;
  am: string;
  tr: string;
  tn: string;
  mc?: string;
  webhookUrl?: string;
}

export const DevPayGateway: React.FC<GatewayProps> = ({
  pa,
  pn,
  am,
  tr,
  tn,
  mc,
  webhookUrl,
}) => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileClient = /iPad|iPhone|iPod|Android/.test(ua);
  const [showQRMobile, setShowQRMobile] = useState(!isMobileClient);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webhookDelivery, setWebhookDelivery] = useState<string | null>(null);
  const [desktopTab, setDesktopTab] = useState<'upi' | 'mobile_web'>('upi');

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

  const genericUPI = `upi://pay?${baseQuery}`;
  const currentWebUrl = typeof window !== 'undefined' ? window.location.href : genericUPI;
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const apps = [
    { name: 'Amazon Pay', id: 'amazon', packageId: 'in.amazon.mShop.android.shopping', scheme: 'amazonpay', bgColor: 'hover:bg-orange-500/20 hover:border-orange-500' },
    { name: 'Google Pay', id: 'gpay', packageId: 'com.google.android.apps.nbu.paisa.user', scheme: 'gpay', bgColor: 'hover:bg-blue-600/20 hover:border-blue-500' },
    { name: 'PhonePe', id: 'phonepe', packageId: 'com.phonepe.app', scheme: 'phonepe', bgColor: 'hover:bg-purple-600/20 hover:border-purple-500' },
    { name: 'BHIM', id: 'bhim', packageId: 'in.org.npci.upiapp', scheme: 'bhim', bgColor: 'hover:bg-orange-500/20 hover:border-orange-500' },
    { name: 'Paytm', id: 'paytm', packageId: 'net.one97.paytm', scheme: 'paytmmp', bgColor: 'hover:bg-sky-600/20 hover:border-sky-500' },
  ];

  const getDeepLink = (pkg: string, scheme: string) => {
    if (isAndroid) return `intent://pay?${baseQuery}#Intent;scheme=upi;package=${pkg};end`;
    if (isIOS) return `${scheme}://pay?${baseQuery}`;
    return genericUPI;
  };

  // GUARANTEE INTENT EXISTS IN DYNAMODB ON MOUNT
  useEffect(() => {
    if (!tr) return;
    fetch(`${API_BASE_URL}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: tr,
        pa,
        pn,
        am,
        tn,
        webhookUrl: webhookUrl || '',
      }),
    }).catch((err) => console.warn('DynamoDB registration note:', err));
  }, [tr, pa, pn, am, tn, webhookUrl]);

  // Cross-device synchronization: Poll DynamoDB with query cache-busting
  useEffect(() => {
    if (status !== 'IDLE' || !tr) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/intents/${tr}?_cb=${Date.now()}`);

        if (res.ok) {
          const data = await res.json();
          console.log(`[DevPay Sync] Checking: ${tr} | Status:`, data?.status);
          if (data && data.status === 'SUCCESS') {
            setWebhookDelivery('SYNCED_VIA_DYNAMODB');
            setStatus('SUCCESS');
          }
        }
      } catch (e) {
        console.debug('Polling wait...', e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [status, tr]);

  const handleSimulateSuccess = async () => {
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/intents/${tr}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setWebhookDelivery(data.webhook || 'DELIVERED');
      setStatus('SUCCESS');
    } catch (err: any) {
      console.error('Simulation error:', err);
      setErrorMessage(err.message || 'Failed to update DynamoDB');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-[#ff5722] selection:text-white font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#ff5722]/10 blur-[130px] pointer-events-none rounded-full"></div>

      <div className="relative w-full max-w-md bg-[#16161a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="bg-zinc-900/80 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#ff5722] to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-[#ff5722]/20">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Dev<span className="text-[#ff5722]">Pay</span> Checkout</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
            SYNC ACTIVE
          </span>
        </div>

        {/* Dynamic Details from Inputs */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-zinc-400">Paying to</span>
            <h2 className="font-semibold text-white text-base">{pn || 'Merchant'}</h2>
            <p className="text-[11px] font-mono text-zinc-400">UPI ID: {pa}</p>
            {tn && <p className="text-[11px] text-zinc-500 italic">Note: "{tn}"</p>}
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">Amount</span>
            <p className="text-2xl font-extrabold text-[#ff5722] font-mono">₹{Number(am || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {status === 'SUCCESS' ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Successful</h3>
              <p className="text-xs text-zinc-400 font-mono">Ref ID: {tr}</p>
              {/* Proof of AWS Lambda + Webhook Execution */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-left max-w-xs mx-auto text-xs font-mono space-y-1">
                <div className="text-zinc-400">AWS DynamoDB: <span className="text-emerald-400">UPDATED (SUCCESS)</span></div>
                <div className="text-zinc-400">Webhook Dispatch: <span className="text-orange-400">{webhookDelivery || 'SENT'}</span></div>
                {webhookUrl && (
                  <div className="text-zinc-500 text-[10px] truncate pt-1 border-t border-zinc-800">
                    Target: {webhookUrl}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStatus('IDLE')}
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-zinc-200 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          ) : status === 'FAILED' ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Failed</h3>
              <p className="text-xs text-zinc-400 font-mono">Transaction was declined or canceled</p>
              <button
                type="button"
                onClick={() => setStatus('IDLE')}
                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-zinc-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {isMobileClient && !showQRMobile ? (
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                    Choose UPI App
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {apps.map((app) => (
                      <a
                        key={app.name}
                        href={getDeepLink(app.packageId, app.scheme)}
                        className={`p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm font-medium transition-all block ${app.bgColor}`}
                      >
                        {app.name}
                      </a>
                    ))}
                  </div>

                  <a
                  href={genericUPI}
                  className="w-full py-2.5 bg-[#ff5722] hover:bg-orange-600 text-white font-medium rounded-xl text-sm flex items-center justify-center transition-all shadow-md shadow-[#ff5722]/20"
                  >
                    Open Default UPI App
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQRMobile(true)}
                    className="w-full text-sm text-center text-zinc-400 hover:text-zinc-200 pt-1 block"
                  >
                    Paying with another phone? Show QR Code
                  </button>
                </div>
              ) : (
                /* DESKTOP VIEW WITH "OPEN ON MOBILE" QR TAB */
                <div className="flex flex-col items-center space-y-3">
                  {/* Selector Pills: UPI App QR vs Open on Mobile */}
                  <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-full">
                    <button
                      type="button"
                      onClick={() => setDesktopTab('upi')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        desktopTab === 'upi'
                          ? 'bg-zinc-800 text-[#ff5722] border border-[#ff5722]/30 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <QrIcon className="w-3.5 h-3.5" />
                      <span>UPI App QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopTab('mobile_web')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        desktopTab === 'mobile_web'
                          ? 'bg-zinc-800 text-[#ff5722] border border-[#ff5722]/30 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Open on Mobile</span>
                    </button>
                  </div>

                  {desktopTab === 'upi' ? (
                    <>
                      <div className="p-3.5 bg-white rounded-xl shadow-lg mt-1">
                        <QRCode value={genericUPI} size={155} />
                      </div>
                      <div className="text-center space-y-0.5">
                        <p className="text-xs font-medium text-zinc-300">Scan with any UPI app to pay</p>
                        <p className="text-[11px] text-zinc-500">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 bg-white rounded-xl shadow-lg mt-1">
                        <QRCode value={currentWebUrl} size={155} />
                      </div>
                      <div className="text-center space-y-0.5 px-3">
                        <p className="text-xs font-medium text-[#ff5722]">Scan with Phone Camera</p>
                        <p className="text-[11px] text-zinc-400">Opens this gateway on mobile with app deep links</p>
                        {isLocalhost ? (
                          <div className="mt-1 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 text-left flex items-start space-x-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Testing on localhost:</strong> Phones cannot open `localhost`. Test across two browser windows or deploy on AWS Amplify to scan with a real phone!</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-mono pt-1 flex items-center justify-center space-x-1">
                            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                            <span>Auto-sync active: Screen updates when paid on phone</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isMobileClient && (
                    <button
                      type="button"
                      onClick={() => setShowQRMobile(false)}
                      className="text-xs text-[#ff5722] hover:underline flex items-center space-x-1 pt-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to app links</span>
                    </button>
                  )}
                </div>
              )}

              {/* Error Message banner if DynamoDB call fails */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Sandbox Simulation Bar */}
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Sandbox Testing Controls
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={handleSimulateSuccess}
                    className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    {isSimulating && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isSimulating ? 'Updating AWS...' : 'Simulate Success'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('FAILED')}
                    className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono rounded-lg transition-colors"
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/40 px-6 py-3 border-t border-zinc-800/80 flex items-center justify-center space-x-1.5 text-zinc-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted UPI Sandbox Protocol</span>
        </div>

      </div>
    </div>
  );
};