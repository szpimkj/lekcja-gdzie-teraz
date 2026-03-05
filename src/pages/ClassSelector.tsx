import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';

// Minimalistic cheerful colors for class buttons - teaching color harmony
const CLASS_COLORS = [
  'bg-lavender text-lavender-foreground',    // A - Lavender (violet)
  'bg-primary text-primary-foreground',      // B - Teal (cool)
  'bg-accent text-accent-foreground',        // C - Coral (warm)
  'bg-info text-info-foreground',            // D - Sunshine (bright)
  'bg-mint text-mint-foreground',            // E - Mint (fresh)
  'bg-secondary text-secondary-foreground',  // F - Peach (gentle)
  'bg-success text-success-foreground',      // G - Sage Green (natural)
  'bg-ocean text-ocean-foreground',          // H - Ocean (deep)
  'bg-rose text-rose-foreground',            // I - Rose (playful)
  'bg-lime text-lime-foreground',            // J - Lime (energetic)
];

const ClassSelector = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'view1' | 'view2' | 'view3'>('view3');

  const { setClass, setSubgroup, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    import('@/lib/xmlParser').then(({ getAllClasses }) => {
      getAllClasses()
        .then((data) => {
          setClasses(data);
          setXmlError(null);
        })
        .catch((err: Error) => {
          console.error(err);
          if (err.message === 'XML_INCOMPLETE') {
            setXmlError(t.xmlIncomplete);
          } else if (err.message.startsWith('XML_INVALID') || err.message.startsWith('XML_PARSE_ERROR')) {
            setXmlError(t.xmlInvalid);
          } else {
            setXmlError(t.xmlLoadError);
          }
        });
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

  // Sorted classes for view 3 - by grade then letter
  const sortedClassesView3 = useMemo(() => {
    const romanToArabic = (roman: string): number => {
      const romanMap: { [key: string]: number } = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
      };
      return romanMap[roman] || 0;
    };

    return [...classes].sort((a, b) => {
      // Extract grade numbers
      const romanMatchA = a.class_label.match(/\b([IVX]+)\b/);
      const romanMatchB = b.class_label.match(/\b([IVX]+)\b/);
      
      const gradeA = romanMatchA 
        ? romanToArabic(romanMatchA[1]) 
        : parseInt(a.class_label.match(/\d+/)?.[0] || '999');
      const gradeB = romanMatchB 
        ? romanToArabic(romanMatchB[1]) 
        : parseInt(b.class_label.match(/\d+/)?.[0] || '999');
      
      // Sort by grade first
      if (gradeA !== gradeB) return gradeA - gradeB;
      
      // If same grade, sort by letter
      const letterA = a.class_label.replace(/\d+|[IVX]+/g, '').trim().toLowerCase();
      const letterB = b.class_label.replace(/\d+|[IVX]+/g, '').trim().toLowerCase();
      return letterA.localeCompare(letterB);
    });
  }, [classes]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      <Header title="Wybierz swoją klasę">
        <Select value={viewMode} onValueChange={(value: 'view1' | 'view2' | 'view3') => setViewMode(value)}>
          <SelectTrigger className="w-24 h-8 text-xs opacity-60 hover:opacity-100 transition-opacity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view1">View 1</SelectItem>
            <SelectItem value="view2">View 2</SelectItem>
            <SelectItem value="view3">View 3</SelectItem>
          </SelectContent>
        </Select>
      </Header>

      {/* Main Content - maximized space for class selection */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-4 md:py-6 overflow-hidden">
        <div className="w-full max-w-6xl">
          {xmlError ? (
            <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertTitle>⚠️ {language === 'pl' ? 'Błąd pliku' : 'File Error'}</AlertTitle>
              <AlertDescription>{xmlError}</AlertDescription>
            </Alert>
          ) : viewMode === 'view1' ? (
            <div className="space-y-6 md:space-y-8">
              {sortedGrades.map((grade) => (
                <div key={grade} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 md:min-w-[140px]">
                    <span className="text-5xl md:text-6xl font-bold text-primary">{grade}</span>
                    <span className="text-xl md:text-2xl font-semibold text-foreground">klasa</span>
                  </div>
                  
                  <div className="flex gap-3 md:gap-4 flex-wrap">
                    {groupedClasses[grade].map((classInfo, idx) => {
                      const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim().toUpperCase();
                      const letterIndex = classLetter.toLowerCase().charCodeAt(0) - 97;
                      const colorClass = CLASS_COLORS[letterIndex % CLASS_COLORS.length];
                      
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
          ) : viewMode === 'view2' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sortedGrades.map((grade, gradeIdx) => (
                <div key={grade} className="space-y-3">
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-4xl font-bold text-primary">{grade}</span>
                    <span className="text-lg font-semibold text-foreground">klasa</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {groupedClasses[grade].map((classInfo, idx) => {
                      const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim().toUpperCase();
                      const letterIndex = classLetter.toLowerCase().charCodeAt(0) - 97;
                      const colorClass = CLASS_COLORS[letterIndex % CLASS_COLORS.length];
                      
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
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 justify-items-center">
              {sortedClassesView3.map((classInfo) => {
                const fullLabel = classInfo.class_label.replace(/\s/g, '').toUpperCase();
                const classLetter = classInfo.class_label.replace(/\d+|[IVX]+/g, '').trim().toUpperCase();
                const letterIndex = classLetter.toLowerCase().charCodeAt(0) - 97;
                const colorClass = CLASS_COLORS[letterIndex % CLASS_COLORS.length];
                
                return (
                  <button
                    key={classInfo.class_id}
                    onClick={() => handleClassClick(classInfo)}
                    className={cn(
                      'h-20 w-20 md:h-24 md:w-24 rounded-3xl transition-smooth shadow-soft',
                      'flex items-center justify-center touch-manipulation font-bold text-2xl md:text-3xl',
                      'hover:scale-110 hover:shadow-medium active:scale-95',
                      colorClass
                    )}
                  >
                    {fullLabel}
                  </button>
                );
              })}
          )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassSelector;
