export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface Period {
  period: number;
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface Lesson {
  class_id: string;
  class_label: string;
  weekday: Weekday;
  period: number;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  subject: string;
  room: string;
  teacher?: string;
  subgroup_id: string; // "" for whole class
  subgroup_label: string;
  priority: number;
  notes?: string;
}

export interface ClassInfo {
  class_id: string;
  class_label: string;
  subgroups?: SubgroupInfo[];
}

export interface SubgroupInfo {
  subgroup_id: string;
  subgroup_label: string;
}

export interface CurrentLessonInfo {
  lesson: Lesson;
  status: 'current' | 'next' | 'end-of-day' | 'no-data';
  minutesRemaining?: number;
  minutesUntil?: number;
  message: string;
}
