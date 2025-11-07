import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Clock, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

// Move static arrays outside component to prevent recreating on every render
const HOVER_COLORS = [
  'hover:bg-primary hover:border-primary hover:text-primary-foreground hover:shadow-colorful',
  'hover:bg-accent hover:border-accent hover:text-accent-foreground hover:shadow-colorful',
  'hover:bg-info hover:border-info hover:text-info-foreground hover:shadow-colorful',
  'hover:bg-success hover:border-success hover:text-success-foreground hover:shadow-colorful',
  'hover:bg-secondary hover:border-secondary hover:text-secondary-foreground hover:shadow-colorful'
];

const BG_GRADIENTS = [
  'bg-gradient-to-br from-primary/10 to-accent/10',
  'bg-gradient-to-br from-info/10 to-success/10',
  'bg-gradient-to-br from-accent/10 to-secondary/10',
  'bg-gradient-to-br from-success/10 to-primary/10',
];

const BTN_COLORS = [
  'border-primary bg-primary hover:bg-primary-foreground hover:text-primary hover:border-primary',
  'border-accent bg-accent hover:bg-accent-foreground hover:text-accent hover:border-accent',
  'border-info bg-info hover:bg-info-foreground hover:text-info hover:border-info',
  'border-success bg-success hover:bg-success-foreground hover:text-success hover:border-success',
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Date and Time Display */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <div className="text-xs sm:text-sm font-medium">
              <span>{weekdayName}</span>
              <span className="mx-1 sm:mx-2">•</span>
              <span>{formattedDate}</span>
              <span className="mx-1 sm:mx-2">•</span>
              <span className="font-mono">{formattedTime}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Gdzie mam lekcję? 📚</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">✨ {t.chooseClass}</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center justify-center gap-3 mt-4 sm:mt-6 touch-manipulation">
            <List className={`h-4 w-4 sm:h-5 sm:w-5 ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch 
              checked={viewMode === 'grid'}
              onCheckedChange={(checked) => setViewMode(checked ? 'grid' : 'list')}
            />
            <LayoutGrid className={`h-4 w-4 sm:h-5 sm:w-5 ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {viewMode === 'list' ? (
          <Card className="shadow-large">
            <CardContent className="pt-6 pb-8">
              <div className="space-y-6">
                {sortedGrades.map((grade) => (
                  <div key={grade} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap sm:min-w-[100px]">
                      🎓 Klasa {grade}
                    </h2>
                     <div className="flex gap-2 sm:gap-3 flex-wrap">
                      {groupedClasses[grade].map((classInfo) => {
                        const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim();
                        const colorClass = HOVER_COLORS[classInfo.class_id.charCodeAt(classInfo.class_id.length - 1) % HOVER_COLORS.length];
                        
                        return (
                          <button
                            key={classInfo.class_id}
                            onClick={() => handleClassClick(classInfo)}
                            className={cn(
                              'group relative h-24 w-24 sm:h-32 sm:w-32 rounded-2xl border-3 transition-bounce',
                              'bg-card border-border shadow-soft',
                              'hover:scale-110 active:scale-95 hover:-rotate-3',
                              'flex items-center justify-center touch-manipulation',
                              colorClass
                            )}
                          >
                            <span className="text-4xl sm:text-5xl font-bold text-foreground group-hover:text-inherit transition-colors">
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
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedGrades.map((grade, idx) => {
              const bgClass = BG_GRADIENTS[idx % BG_GRADIENTS.length];
              
              return (
                <Card 
                  key={grade} 
                  className={cn(
                    "p-4 sm:p-6 hover:shadow-colorful transition-bounce hover:scale-105 border-2",
                    bgClass
                  )}
                >
                  <h3 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4 text-primary">
                    🎯 Klasa {grade}
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                    {groupedClasses[grade].map((classInfo, btnIdx) => {
                      const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim();
                      const btnColor = BTN_COLORS[btnIdx % BTN_COLORS.length];
                      
                      return (
                        <button
                          key={classInfo.class_id}
                          onClick={() => handleClassClick(classInfo)}
                          className={cn(
                            "w-11 h-11 sm:w-12 sm:h-12 rounded-full border-3 text-white transition-bounce",
                            "flex items-center justify-center font-bold text-base sm:text-lg uppercase",
                            "touch-manipulation hover:scale-125 active:scale-95 hover:rotate-12 shadow-medium",
                            btnColor
                          )}
                        >
                          {classLetter}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassSelector;
