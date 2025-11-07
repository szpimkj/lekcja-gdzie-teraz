import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

// Soft pastel colors for class buttons - minimalistic and child-friendly
const CLASS_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-accent text-accent-foreground',
  'bg-info text-info-foreground',
  'bg-success text-success-foreground',
  'bg-secondary text-secondary-foreground',
];

const ClassSelector = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('Europe/Warsaw'));
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
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
    import('@/lib/xmlParser').then(({ getAllClasses }) => {
      getAllClasses()
        .then((data) => setClasses(data))
        .catch(console.error);
    });
  }, []);

  const handleClassClick = (classInfo: ClassInfo, subgroupId?: string) => {
    setClass(classInfo.class_id, classInfo.class_label);
    
    if (subgroupId) {
      const subgroup = classInfo.subgroups?.find(s => s.subgroup_id === subgroupId);
      if (subgroup) {
        setSubgroup(subgroup.subgroup_id, subgroup.subgroup_label);
      }
    } else {
      setSubgroup(null, null);
    }
    
    navigate('/now');
  };

  // Group classes by grade level - memoized to prevent recalculation on every render
  const { groupedClasses, sortedGrades } = useMemo(() => {
    const romanToArabic = (roman: string): number => {
      const romanMap: { [key: string]: number } = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
      };
      return romanMap[roman] || 0;
    };

    const grouped = classes.reduce((acc, cls) => {
      // Try to match Roman numerals first
      const romanMatch = cls.class_label.match(/\b([IVX]+)\b/);
      let grade: string;
      
      if (romanMatch) {
        const arabicNum = romanToArabic(romanMatch[1]);
        grade = arabicNum > 0 ? arabicNum.toString() : 'Inne';
      } else {
        // Fall back to Arabic numerals
        grade = cls.class_label.match(/\d+/)?.[0] || 'Inne';
      }
      
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(cls);
      return acc;
    }, {} as Record<string, ClassInfo[]>);

    const sorted = Object.keys(grouped).sort((a, b) => {
      if (a === 'Inne') return 1;
      if (b === 'Inne') return -1;
      return parseInt(a) - parseInt(b);
    });

    return { groupedClasses: grouped, sortedGrades: sorted };
  }, [classes]);

  // Format current date and time
  const weekdayNames = {
    pl: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const weekdayName = weekdayNames[language][currentTime.weekday - 1];
  const formattedDate = currentTime.toFormat('dd.MM.yyyy');
  const formattedTime = currentTime.toFormat('HH:mm:ss');

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Minimal Header with Time/Date */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground">{weekdayName}</div>
          <div className="text-2xl font-bold text-foreground">{formattedTime}</div>
          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>
        
        {/* Very small toggle for A/B testing */}
        <div className="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity">
          <List className={cn("h-3 w-3", viewMode === 'list' ? 'text-primary' : 'text-muted-foreground')} />
          <Switch 
            checked={viewMode === 'grid'}
            onCheckedChange={(checked) => setViewMode(checked ? 'grid' : 'list')}
            className="scale-75"
          />
          <LayoutGrid className={cn("h-3 w-3", viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground')} />
        </div>
      </header>

      {/* Main Content - Single screen, no scroll */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-hidden">
        {/* Simple, clean title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          {t.chooseClass}
        </h1>
        <p className="text-muted-foreground mb-8 md:mb-12 text-center">Wybierz swoją klasę</p>

        {/* Clean class selection - fits on one screen */}
        <div className="w-full max-w-5xl">
          {viewMode === 'list' ? (
            <div className="space-y-6 md:space-y-8">
              {sortedGrades.map((grade) => (
                <div key={grade} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 md:min-w-[120px]">
                    <span className="text-4xl md:text-5xl font-bold text-primary/20">{grade}</span>
                    <span className="text-lg font-medium text-muted-foreground">klasa</span>
                  </div>
                  
                  <div className="flex gap-3 md:gap-4 flex-wrap">
                    {groupedClasses[grade].map((classInfo, idx) => {
                      const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim().toUpperCase();
                      const colorClass = CLASS_COLORS[idx % CLASS_COLORS.length];
                      
                      return (
                        <button
                          key={classInfo.class_id}
                          onClick={() => handleClassClick(classInfo)}
                          className={cn(
                            'h-20 w-20 md:h-24 md:w-24 rounded-3xl transition-smooth shadow-soft',
                            'flex items-center justify-center touch-manipulation font-bold text-3xl md:text-4xl',
                            'hover:scale-110 hover:shadow-medium active:scale-95',
                            colorClass
                          )}
                        >
                          {classLetter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedGrades.map((grade, gradeIdx) => (
                <div key={grade} className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary/20">{grade}</span>
                    <span className="text-sm text-muted-foreground">klasa</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {groupedClasses[grade].map((classInfo, idx) => {
                      const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim().toUpperCase();
                      const colorClass = CLASS_COLORS[(gradeIdx + idx) % CLASS_COLORS.length];
                      
                      return (
                        <button
                          key={classInfo.class_id}
                          onClick={() => handleClassClick(classInfo)}
                          className={cn(
                            'h-16 w-16 rounded-2xl transition-smooth shadow-soft',
                            'flex items-center justify-center touch-manipulation font-bold text-2xl',
                            'hover:scale-110 hover:shadow-medium active:scale-95',
                            colorClass
                          )}
                        >
                          {classLetter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClassSelector;
