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

      setDemoParams({
        pa: parsed?.pa || params.get('pa') || 'merchant@okaxis',
        pn: parsed?.pn || params.get('pn') || 'DevPay Demo Merchant',
        am: parsed?.am || params.get('am') || '10.00',
        tr: parsed?.tr || params.get('tr') || 'TXN_123456',
        tn: parsed?.tn || params.get('tn') || 'DevPay sandbox testing',
        mc: parsed?.mc || params.get('mc') || '5411',
        webhookUrl: parsed?.webhookUrl || params.get('webhookUrl') || '',
      });
    }
  }, []);

  if (isDemoMode) {
    return <DevPayGateway {...demoParams} />;
  }

  return <DevPaySandbox />;
}

export default App;