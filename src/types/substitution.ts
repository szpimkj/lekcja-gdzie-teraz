export interface Substitution {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Class ID (e.g., "4a") */
  class_id: string;
  /** Period number */
  period: number;
  /** Original subject name to match against */
  original_subject?: string;
  /** Subgroup ID if substitution applies to specific subgroup */
  subgroup_id?: string;
  /** Type of substitution */
  type: 'change' | 'cancel';
  /** New subject (for type 'change') */
  new_subject?: string;
  /** New teacher (for type 'change') */
  new_teacher?: string;
  /** New room (for type 'change') */
  new_room?: string;
  /** Optional note */
  note?: string;
}

export interface AppliedSubstitution {
  original: {
    subject: string;
    teacher?: string;
    room: string;
  };
  substitution: Substitution;
}
