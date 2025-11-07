import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Clock, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

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

  // Group classes by grade level (extract number from class_label, handle Roman numerals)
  const romanToArabic = (roman: string): number => {
    const romanMap: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    return romanMap[roman] || 0;
  };

  const groupedClasses = classes.reduce((acc, cls) => {
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
          
          {/* View Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <List className={`h-5 w-5 ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch 
              checked={viewMode === 'grid'}
              onCheckedChange={(checked) => setViewMode(checked ? 'grid' : 'list')}
            />
            <LayoutGrid className={`h-5 w-5 ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {viewMode === 'list' ? (
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
                        const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim();
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedGrades.map((grade) => (
              <Card 
                key={grade} 
                className="p-6 hover:shadow-lg transition-smooth"
              >
                <h3 className="text-lg font-bold text-center mb-4">
                  Klasa {grade}
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {groupedClasses[grade].map((classInfo) => {
                    const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim();
                    return (
                      <button
                        key={classInfo.class_id}
                        onClick={() => handleClassClick(classInfo)}
                        className="w-12 h-12 rounded-full border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground transition-smooth flex items-center justify-center font-bold text-lg uppercase"
                      >
                        {classLetter}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassSelector;
