import { Lesson, ClassInfo, Period, Weekday } from '@/types/schedule';
import { ROMAN_TO_ARABIC } from './constants';

// Day encoding mapping from binary string to weekday
const DAY_ENCODING_MAP: Record<string, Weekday> = {
  '10000': 'MON',
  '01000': 'TUE',
  '00100': 'WED',
  '00010': 'THU',
  '00001': 'FRI',
};

// Maps for ID lookups
interface SubjectMap {
  [id: string]: { name: string; short: string };
}

interface TeacherMap {
  [id: string]: { name: string; short: string };
}

interface ClassroomMap {
  [id: string]: { name: string; short: string };
}

interface ClassMap {
  [id: string]: { name: string; short: string; classid: string };
}

interface GroupMap {
  [id: string]: {
    name: string;
    classid: string;
    entireclass: boolean;
    divisiontag: string;
  };
}

interface LessonMap {
  [id: string]: {
    classids: string[];
    subjectid: string;
    teacherids: string[];
    groupids: string[];
  };
}

interface PeriodMap {
  [period: string]: { start: string; end: string };
}

/**
 * Normalize class ID from XML name
 * Converts Roman numerals to Arabic and removes spaces
 */
function normalizeClassId(className: string): string {
  let normalized = className.trim().toLowerCase();

  // Handle Roman numerals - process longest first to avoid partial matches (e.g., "I" matching before "III")
  const sortedRomans = Object.entries(ROMAN_TO_ARABIC).sort((a, b) => b[0].length - a[0].length);
  for (const [roman, arabic] of sortedRomans) {
    normalized = normalized.replace(roman.toLowerCase(), arabic);
  }

  // Remove spaces
  normalized = normalized.replace(/\s+/g, '');

  return normalized;
}

/**
 * Normalize class label for display
 * Converts Roman numerals to Arabic and ensures consistent casing
 */
function normalizeClassLabel(className: string): string {
  let normalized = className.trim();

  // Handle Roman numerals (case insensitive) - process longest first to avoid partial matches
  const sortedRomans = Object.entries(ROMAN_TO_ARABIC).sort((a, b) => b[0].length - a[0].length);
  for (const [roman, arabic] of sortedRomans) {
    const regex = new RegExp(`\\b${roman}\\b`, 'gi');
    normalized = normalized.replace(regex, arabic);
  }

  // Convert letter suffixes to lowercase (a, b, c, etc.)
  normalized = normalized.replace(/\b([A-Z])\b/g, (match) => match.toLowerCase());

  return normalized;
}

// Map subgroup based on division tag and name
function mapSubgroupId(groupName: string, divisionTag: string, entireClass: boolean): { 
  subgroup_id: string; 
  subgroup_label: string; 
} {
  if (entireClass) {
    return { subgroup_id: '', subgroup_label: '' };
  }
  
  const nameLower = groupName.toLowerCase();
  
  // Division tag 1: numbered groups
  if (divisionTag === '1') {
    if (nameLower.includes('1.') || nameLower.includes('grupa i') || nameLower === 'grupa i') {
      return { subgroup_id: 'gr1', subgroup_label: '1. Grupa' };
    }
    if (nameLower.includes('2.') || nameLower.includes('grupa ii') || nameLower === 'grupa ii') {
      return { subgroup_id: 'gr2', subgroup_label: '2. Grupa' };
    }
  }
  
  // Division tag 2: gender groups
  if (divisionTag === '2') {
    if (nameLower.includes('chłop') || nameLower.includes('boys')) {
      return { subgroup_id: 'ch', subgroup_label: 'Chłopcy' };
    }
    if (nameLower.includes('dziew') || nameLower.includes('girls')) {
      return { subgroup_id: 'dz', subgroup_label: 'Dziewczęta' };
    }
  }
  
  // Default: use group name as is
  return { subgroup_id: groupName.toLowerCase().replace(/\s+/g, '_'), subgroup_label: groupName };
}

export async function parseScheduleXML(): Promise<{
  lessons: Lesson[];
  classes: ClassInfo[];
  periods: Period[];
}> {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'data/asctt2012.xml');
    let xmlText = await response.text();

    // Strip any junk content before the XML declaration
    const xmlDeclIndex = xmlText.indexOf('<?xml');
    if (xmlDeclIndex > 0) {
      xmlText = xmlText.substring(xmlDeclIndex);
    } else if (xmlDeclIndex === -1) {
      throw new Error('XML_INVALID: No XML declaration found in the schedule file.');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML_PARSE_ERROR: ' + parseError.textContent);
    }

    // Validate that the file contains card entries (time assignments)
    const cardCount = xmlDoc.querySelectorAll('card').length;
    if (cardCount === 0) {
      throw new Error('XML_INCOMPLETE');
    }
    
    // Build lookup maps
    const subjects: SubjectMap = {};
    xmlDoc.querySelectorAll('subject').forEach(el => {
      subjects[el.getAttribute('id')!] = {
        name: el.getAttribute('name')!,
        short: el.getAttribute('short')!,
      };
    });
    
    const teachers: TeacherMap = {};
    xmlDoc.querySelectorAll('teacher').forEach(el => {
      teachers[el.getAttribute('id')!] = {
        name: el.getAttribute('name')!,
        short: el.getAttribute('short')!,
      };
    });
    
    const classrooms: ClassroomMap = {};
    xmlDoc.querySelectorAll('classroom').forEach(el => {
      classrooms[el.getAttribute('id')!] = {
        name: el.getAttribute('name')!,
        short: el.getAttribute('short')!,
      };
    });
    
    const classes: ClassMap = {};
    xmlDoc.querySelectorAll('classes > class').forEach(el => {
      const id = el.getAttribute('id')!;
      const name = el.getAttribute('name')!;
      const short = el.getAttribute('short')!;
      
      // Only keep classes with numeric grade (1-8)
      const shortTrimmed = short.trim();
      const gradeMatch = shortTrimmed.match(/^(\d+)\s/);
      if (!gradeMatch || parseInt(gradeMatch[1]) < 1 || parseInt(gradeMatch[1]) > 8) {
        return;
      }
      
      classes[id] = {
        name: short.trim() || normalizeClassLabel(name),
        short,
        classid: normalizeClassId(short.trim() || name),
      };
    });
    
    const groups: GroupMap = {};
    xmlDoc.querySelectorAll('group').forEach(el => {
      groups[el.getAttribute('id')!] = {
        name: el.getAttribute('name')!,
        classid: el.getAttribute('classid')!,
        entireclass: el.getAttribute('entireclass') === '1',
        divisiontag: el.getAttribute('divisiontag')!,
      };
    });
    
    const periodsMap: PeriodMap = {};
    xmlDoc.querySelectorAll('period').forEach(el => {
      const period = el.getAttribute('period')!;
      periodsMap[period] = {
        start: el.getAttribute('starttime')!,
        end: el.getAttribute('endtime')!,
      };
    });
    
    const lessonsMap: LessonMap = {};
    xmlDoc.querySelectorAll('lessons > lesson').forEach(el => {
      lessonsMap[el.getAttribute('id')!] = {
        classids: (el.getAttribute('classids') || '').split(',').filter(Boolean),
        subjectid: el.getAttribute('subjectid')!,
        teacherids: (el.getAttribute('teacherids') || '').split(',').filter(Boolean),
        groupids: (el.getAttribute('groupids') || '').split(',').filter(Boolean),
      };
    });
    
    // Parse cards and generate lessons
    const lessons: Lesson[] = [];
    
    xmlDoc.querySelectorAll('card').forEach(cardEl => {
      const lessonid = cardEl.getAttribute('lessonid')!;
      const classroomid = cardEl.getAttribute('classroomids')!;
      const period = cardEl.getAttribute('period')!;
      const days = cardEl.getAttribute('days')!;
      
      const lesson = lessonsMap[lessonid];
      if (!lesson) return;
      
      const weekday = DAY_ENCODING_MAP[days];
      if (!weekday) return; // Skip non-standard days
      
      const periodInfo = periodsMap[period];
      if (!periodInfo) return;
      
      const subject = subjects[lesson.subjectid];
      const teacher = lesson.teacherids[0] ? teachers[lesson.teacherids[0]] : null;
      const classroom = classroomid ? classrooms[classroomid] : null;
      
      // Process each class-group combination
      lesson.classids.forEach((classid, idx) => {
        const classInfo = classes[classid];
        if (!classInfo) return; // Skip filtered classes (e.g., świetlica)
        
        const groupid = lesson.groupids[idx];
        const group = groupid ? groups[groupid] : null;
        
        const subgroupInfo = group 
          ? mapSubgroupId(group.name, group.divisiontag, group.entireclass)
          : { subgroup_id: '', subgroup_label: '' };
        
        lessons.push({
          class_id: classInfo.classid,
          class_label: classInfo.name, // Already normalized
          weekday,
          period: parseInt(period),
          start_time: periodInfo.start,
          end_time: periodInfo.end,
          subject: subject?.name || 'Unknown',
          room: classroom?.short || '',
          teacher: teacher?.name || '',
          subgroup_id: subgroupInfo.subgroup_id,
          subgroup_label: subgroupInfo.subgroup_label,
          priority: 0,
          notes: '',
        });
      });
    });
    
    // Generate classes info with subgroups
    const classesInfo: ClassInfo[] = [];
    const classSubgroupsMap = new Map<string, Set<string>>();
    
    // Collect all subgroups per class
    lessons.forEach(lesson => {
      if (lesson.subgroup_id) {
        if (!classSubgroupsMap.has(lesson.class_id)) {
          classSubgroupsMap.set(lesson.class_id, new Set());
        }
        classSubgroupsMap.get(lesson.class_id)!.add(
          JSON.stringify({ 
            subgroup_id: lesson.subgroup_id, 
            subgroup_label: lesson.subgroup_label 
          })
        );
      }
    });
    
    // Get unique classes
    const uniqueClasses = new Map<string, string>();
    Object.values(classes).forEach(c => {
      uniqueClasses.set(c.classid, c.name);
    });
    
    uniqueClasses.forEach((label, id) => {
      const subgroupsSet = classSubgroupsMap.get(id) || new Set();
      const subgroups = Array.from(subgroupsSet)
        .map(s => JSON.parse(s))
        .filter((s, idx, arr) => 
          arr.findIndex(x => x.subgroup_id === s.subgroup_id) === idx
        );
      
      classesInfo.push({
        class_id: id,
        class_label: label,
        subgroups,
      });
    });
    
    // Sort classes
    classesInfo.sort((a, b) => a.class_id.localeCompare(b.class_id));
    
    // Generate periods array
    const periodsArray: Period[] = Object.entries(periodsMap)
      .map(([period, times]) => ({
        period: parseInt(period),
        start: times.start,
        end: times.end,
      }))
      .sort((a, b) => a.period - b.period);
    
    return { lessons, classes: classesInfo, periods: periodsArray };
  } catch (error) {
    console.error('Error parsing schedule XML:', error);
    throw error;
  }
}

// Cache parsed data
let cachedData: {
  lessons: Lesson[];
  classes: ClassInfo[];
  periods: Period[];
} | null = null;

export async function getScheduleData() {
  if (!cachedData) {
    cachedData = await parseScheduleXML();
  }
  return cachedData;
}

// Get lessons for a specific class
export async function getLessonsForClass(classId: string): Promise<Lesson[]> {
  const { lessons } = await getScheduleData();
  return lessons.filter(l => l.class_id === classId);
}

// Get all classes
export async function getAllClasses(): Promise<ClassInfo[]> {
  const { classes } = await getScheduleData();
  return classes;
}

// Get periods
export async function getPeriods(): Promise<Period[]> {
  const { periods } = await getScheduleData();
  return periods;
}
