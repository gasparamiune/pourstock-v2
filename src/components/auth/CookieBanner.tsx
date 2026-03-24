import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cookie-consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'essential-only');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1">We use cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. No tracking or analytics cookies.{' '}
              <Link to="/cookies" className="text-primary underline" onClick={() => setVisible(false)}>
                Cookie Policy
              </Link>{' '}
              ·{' '}
              <Link to="/privacy" className="text-primary underline" onClick={() => setVisible(false)}>
                Privacy Policy
              </Link>
            </p>
          </div>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={accept} className="flex-1">Accept all</Button>
          <Button size="sm" variant="outline" onClick={decline} className="flex-1">Essential only</Button>
        </div>
      </div>
    </div>
  );
}
