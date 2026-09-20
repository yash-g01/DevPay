import React, { useState, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { Terminal, CheckCircle2, XCircle, Smartphone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { isIOS, isAndroid } from 'react-device-detect';

interface GatewayProps {
  pa: string;
  pn: string;
  am: string;
  tr: string;
  tn: string;
  mc?: string;
}

export const DevPayGateway: React.FC<GatewayProps> = ({
  pa,
  pn,
  am,
  tr,
  tn,
  mc,
}) => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileClient = /iPad|iPhone|iPod|Android/.test(ua);
  const [showQRMobile, setShowQRMobile] = useState(!isMobileClient);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');

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
            TEST MODE
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
                    className="w-full text-xs text-center text-zinc-400 hover:text-zinc-200 pt-1 block"
                  >
                    Paying with another phone? Show QR Code
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3.5 bg-white rounded-xl shadow-lg">
                    <QRCode value={genericUPI} size={170} />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-zinc-300 flex items-center justify-center space-x-1">
                      <Smartphone className="w-3.5 h-3.5 text-[#ff5722]" />
                      <span>Scan with any UPI app to pay</span>
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">Ref: {tr}</p>
                  </div>

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

              {/* Sandbox Simulation Bar */}
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Sandbox Testing Controls
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('SUCCESS')}
                    className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono rounded-lg transition-colors"
                  >
                    Simulate Success
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