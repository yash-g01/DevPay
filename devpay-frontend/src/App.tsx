import { useState, useEffect } from 'react';
import { DevPaySandbox } from './DevPaySandbox';
import { DevPayGateway } from './DevPayGateway';

export function App() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoParams, setDemoParams] = useState({
    pa: '',
    pn: '',
    am: '',
    tr: '',
    tn: '',
    mc: '',
    webhookUrl: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setIsDemoMode(true);

      // Check localStorage first for instant multi-tab sync
      const cached = localStorage.getItem('devpay_live_params');
      let parsed = null;
      try {
        if (cached) parsed = JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached params', e);
      }

      // Inside useEffect in src/App.tsx:
      setDemoParams({
        pa: params.get('pa') || parsed?.pa || 'merchant@okaxis',
        pn: params.get('pn') || parsed?.pn || 'DevPay Demo Merchant',
        am: params.get('am') || parsed?.am || '10.00',
        tr: params.get('tr') || parsed?.tr || 'TXN_123456',
        tn: params.get('tn') || parsed?.tn || 'DevPay sandbox testing',
        mc: params.get('mc') || parsed?.mc || '5411',
        webhookUrl: params.get('webhookUrl') || parsed?.webhookUrl || '',
      });
    }
  }, []);

  if (isDemoMode) {
    return <DevPayGateway {...demoParams} />;
  }

  return <DevPaySandbox />;
}

export default App;