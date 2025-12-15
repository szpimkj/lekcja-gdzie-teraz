import { useState, useEffect } from 'react';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ClassPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassPicker({ open, onOpenChange }: ClassPickerProps) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  
  const { setClass, language } = useSettingsStore();
  const t = translations[language];

  useEffect(() => {
    import('@/lib/xmlParser').then(({ getAllClasses }) => {
      getAllClasses()
        .then((data) => setClasses(data))
        .catch(console.error);
    });
  }, []);

  const handleSave = () => {
    if (!selectedClass) return;
    
    setClass(selectedClass.class_id, selectedClass.class_label);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.chooseClass}</DialogTitle>
          <DialogDescription>
            {t.selectClass}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="class">{t.selectClass}</Label>
            <Select
              value={selectedClass?.class_id}
              onValueChange={(value) => {
                const cls = classes.find(c => c.class_id === value);
                setSelectedClass(cls || null);
              }}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder={t.selectClass} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.class_id} value={cls.class_id}>
                    {cls.class_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <Button 
            onClick={handleSave} 
            disabled={!selectedClass}
            className="w-full"
          >
            {t.settings}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
