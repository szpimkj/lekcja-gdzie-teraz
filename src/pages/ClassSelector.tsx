import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, ArrowRight, Clock } from 'lucide-react';

const ClassSelector = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('Europe/Warsaw'));
  
  const { setClass, setSubgroup, language, class_id } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().setZone('Europe/Warsaw'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/data/classes.json')
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch(console.error);
  }, []);

  const handleContinue = () => {
    if (!selectedClass) return;
    
    setClass(selectedClass.class_id, selectedClass.class_label);
    
    if (selectedSubgroup && selectedSubgroup !== 'none') {
      const subgroup = selectedClass.subgroups?.find(s => s.subgroup_id === selectedSubgroup);
      if (subgroup) {
        setSubgroup(subgroup.subgroup_id, subgroup.subgroup_label);
      }
    } else {
      setSubgroup(null, null);
    }
    
    navigate('/');
  };

  // If already has a class, show option to change or continue
  const hasClass = class_id !== null;

  // Format current date and time
  const weekdayNames = {
    pl: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const weekdayName = weekdayNames[language][currentTime.weekday - 1];
  const formattedDate = currentTime.toFormat('dd.MM.yyyy');
  const formattedTime = currentTime.toFormat('HH:mm:ss');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          {/* Date and Time Display */}
          <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <div className="text-sm font-medium">
              <span>{weekdayName}</span>
              <span className="mx-2">•</span>
              <span>{formattedDate}</span>
              <span className="mx-2">•</span>
              <span className="font-mono">{formattedTime}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Gdzie mam lekcję?</h1>
            </div>
            <p className="text-muted-foreground">{t.chooseClass}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 flex flex-col justify-center">
        <Card className="shadow-large">
          <CardContent className="pt-6 space-y-6">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class" className="text-base font-semibold">
                {t.selectClass}
              </Label>
              <Select
                value={selectedClass?.class_id}
                onValueChange={(value) => {
                  const cls = classes.find(c => c.class_id === value);
                  setSelectedClass(cls || null);
                  setSelectedSubgroup('');
                }}
              >
                <SelectTrigger id="class" className="h-12 text-base">
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

            {/* Subgroup Selection */}
            {selectedClass && selectedClass.subgroups && selectedClass.subgroups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subgroup" className="text-base font-semibold">
                  {t.selectSubgroup}
                </Label>
                <Select
                  value={selectedSubgroup || 'none'}
                  onValueChange={(val) => setSelectedSubgroup(val === 'none' ? '' : val)}
                >
                  <SelectTrigger id="subgroup" className="h-12 text-base">
                    <SelectValue placeholder={t.selectSubgroup} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.selectSubgroup}</SelectItem>
                    {selectedClass.subgroups.map((sub) => (
                      <SelectItem key={sub.subgroup_id} value={sub.subgroup_id}>
                        {sub.subgroup_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Opcjonalne - pozostaw puste aby widzieć wszystkie grupy
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <Button 
                onClick={handleContinue}
                disabled={!selectedClass}
                size="lg"
                className="w-full h-14 text-lg font-bold gradient-hero gap-2"
              >
                {hasClass ? 'Zapisz zmiany' : 'Kontynuuj'}
                <ArrowRight className="h-5 w-5" />
              </Button>

              {hasClass && (
                <Button
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="w-full"
                >
                  Anuluj
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClassSelector;
