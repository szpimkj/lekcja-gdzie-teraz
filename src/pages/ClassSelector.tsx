import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ClassSelector = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('Europe/Warsaw'));
  
  const { setClass, setSubgroup, language } = useSettingsStore();
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

  const handleClassClick = (classInfo: ClassInfo) => {
    setClass(classInfo.class_id, classInfo.class_label);
    setSubgroup(null, null);
    navigate('/now');
  };

  // Group classes by grade level (extract number from class_label)
  const groupedClasses = classes.reduce((acc, cls) => {
    const grade = cls.class_label.match(/\d+/)?.[0] || 'Inne';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(cls);
    return acc;
  }, {} as Record<string, ClassInfo[]>);

  const sortedGrades = Object.keys(groupedClasses).sort((a, b) => {
    if (a === 'Inne') return 1;
    if (b === 'Inne') return -1;
    return parseInt(a) - parseInt(b);
  });

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
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-large">
          <CardContent className="pt-6 pb-8">
            <div className="space-y-8">
              {sortedGrades.map((grade) => (
                <div key={grade} className="flex items-center gap-4 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground whitespace-nowrap min-w-[100px]">
                    Klasa {grade}
                  </h2>
                  <div className="flex gap-3 flex-wrap">
                    {groupedClasses[grade].map((classInfo) => {
                      const classLetter = classInfo.class_label.replace(/\d+/g, '').trim();
                      return (
                        <button
                          key={classInfo.class_id}
                          onClick={() => handleClassClick(classInfo)}
                          className={cn(
                            'group relative h-32 w-32 rounded-xl border-2 transition-all duration-200',
                            'bg-card hover:bg-primary/5 border-border hover:border-primary',
                            'hover:shadow-md hover:scale-105 active:scale-95',
                            'flex items-center justify-center'
                          )}
                        >
                          <span className="text-5xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {classLetter}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClassSelector;
