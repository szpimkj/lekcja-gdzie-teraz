import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ClassInfo } from '@/types/schedule';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PinDialog } from '@/components/PinDialog';

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
  const [viewMode, setViewMode] = useState<'view1' | 'view2' | 'view3'>('view1');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingExitFullScreen, setPendingExitFullScreen] = useState(false);
  
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

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      
      // If we're in fullscreen mode state but browser exited fullscreen
      if (!isCurrentlyFullScreen && isFullScreen) {
        if (pendingExitFullScreen) {
          // This is an authorized exit with correct PIN
          setIsFullScreen(false);
          setPendingExitFullScreen(false);
        } else {
          // Unauthorized exit attempt - show PIN dialog and re-enter
          if (!showPinDialog) {
            setShowPinDialog(true);
          }
          // Re-enter fullscreen immediately without animation frame delay
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Failed to re-enter fullscreen:', err);
          });
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen, pendingExitFullScreen, showPinDialog]);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      setShowPinDialog(true);
    }
  };

  const handleCorrectPin = () => {
    // Set flag to allow exit, then exit fullscreen
    setPendingExitFullScreen(true);
    setShowPinDialog(false);
    
    document.exitFullscreen().catch((err) => {
      console.error('Failed to exit fullscreen:', err);
      setPendingExitFullScreen(false);
    });
  };

  const handlePinCancel = () => {
    // Just close the dialog, stay in fullscreen
    setShowPinDialog(false);
    
    // Ensure we're still in fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  };

  const handleWrongPin = () => {
    // Ensure we're still in fullscreen after wrong PIN
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  };

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
      {/* Compact Banner Header */}
      <header className="bg-accent border-2 border-accent shadow-soft">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Time/Date - compact on the left */}
          <div className="hidden md:flex flex-col items-start text-xs text-accent-foreground/80">
            <div className="font-semibold text-accent-foreground">{formattedTime}</div>
            <div>{weekdayName}, {formattedDate}</div>
          </div>
          
          {/* Main Title - centered and prominent */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-accent-foreground">
              Wybierz swoją klasę
            </h1>
          </div>
          
          {/* View selector dropdown */}
          <div className="absolute top-2 right-2 md:relative md:top-0 md:right-0 flex flex-col items-end gap-1 ml-3">
            <Select value={viewMode} onValueChange={(value: 'view1' | 'view2' | 'view3') => setViewMode(value)}>
              <SelectTrigger className="w-24 h-7 text-xs opacity-60 hover:opacity-100 transition-opacity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view1">View 1</SelectItem>
                <SelectItem value="view2">View 2</SelectItem>
                <SelectItem value="view3">View 3</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              onClick={toggleFullScreen}
              className="opacity-20 hover:opacity-60 transition-opacity"
              title={isFullScreen ? "Wyjdź z trybu pełnoekranowego" : "Tryb pełnoekranowy"}
            >
              {isFullScreen ? (
                <Minimize className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Maximize className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile time/date - below title */}
        <div className="md:hidden px-4 pb-2 text-center text-xs text-accent-foreground/80">
          <span className="font-semibold">{formattedTime}</span>
          <span className="mx-2">•</span>
          <span>{weekdayName}, {formattedDate}</span>
        </div>
      </header>

      {/* Main Content - maximized space for class selection */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-4 md:py-6 overflow-hidden">
        <div className="w-full max-w-6xl">
          {viewMode === 'view1' ? (
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
              {classes.map((classInfo) => {
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
            </div>
          )}
        </div>
      </main>

      <PinDialog
        open={showPinDialog}
        onCorrectPin={handleCorrectPin}
        onCancel={handlePinCancel}
        onWrongPin={handleWrongPin}
      />
    </div>
  );
};

export default ClassSelector;
