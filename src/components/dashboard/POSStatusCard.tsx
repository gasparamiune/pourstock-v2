import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { POSSyncStatus } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface POSStatusCardProps {
  status: POSSyncStatus;
  onSync?: () => void;
}

export function POSStatusCard({ status, onSync }: POSStatusCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            status.isConnected ? "bg-success/20" : "bg-destructive/20"
          )}>
            {status.isConnected ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Spectra POS</h3>
            <p className={cn(
              "text-sm",
              status.isConnected ? "text-success" : "text-destructive"
            )}>
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSync}
          className="touch-target"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {status.lastSyncAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last sync</span>
            <span className="font-medium">
              {formatDistanceToNow(status.lastSyncAt, { addSuffix: true })}
            </span>
          </div>
        )}

        {status.pendingItems > 0 && (
          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 p-2 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span>{status.pendingItems} items pending sync</span>
          </div>
        )}

        {status.errors.length > 0 && (
          <div className="space-y-1">
            {status.errors.map((error, idx) => (
              <div key={idx} className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                {error}
              </div>
            ))}
          </div>
        )}

        {status.isConnected && status.pendingItems === 0 && status.errors.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-2 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span>All systems operational</span>
          </div>
        )}
      </div>
    </div>
  );
}
