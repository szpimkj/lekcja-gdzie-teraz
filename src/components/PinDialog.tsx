import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PinDialogProps {
  open: boolean;
  onCorrectPin: () => void;
  onCancel: () => void;
  onWrongPin?: () => void;
}

const HARDCODED_PIN = '62007'; // Change this to your desired PIN

export const PinDialog = ({ open, onCorrectPin, onCancel, onWrongPin }: PinDialogProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === HARDCODED_PIN) {
      onCorrectPin();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
      onWrongPin?.();
    }
  };

  const handleCancel = () => {
    setPin('');
    setError(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wprowadź PIN</DialogTitle>
          <DialogDescription>
            Aby wyjść z trybu pełnoekranowego, wprowadź PIN.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(false);
              }}
              placeholder="*****"
              className={`text-center text-2xl tracking-widest ${error ? 'border-destructive' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-2">Nieprawidłowy PIN</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Anuluj
            </Button>
            <Button type="submit" className="flex-1">
              Potwierdź
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
