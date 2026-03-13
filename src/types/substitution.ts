export interface Substitution {
  /** Start date in YYYY-MM-DD format */
  date_from: string;
  /** End date in YYYY-MM-DD format */
  date_to: string;
  /** Class ID (e.g., "4a") */
  class_id: string;
  /** Period number */
  period: number;
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
