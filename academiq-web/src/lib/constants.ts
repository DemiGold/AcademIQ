export const FACULTIES = [
  "Science",
  "Management Sciences",
  "Engineering",
] as const;

export type FacultyName = typeof FACULTIES[number];

export const DEPARTMENTS: Record<FacultyName, string[]> = {
  Science: [
    "Computer Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Biochemistry",
    "Microbiology",
    "Statistics",
    "Geology",
  ],
  "Management Sciences": [
    "Accounting",
    "Business Administration",
    "Finance",
    "Insurance",
    "Actuarial Science",
    "Industrial Relations",
  ],
  Engineering: [
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Computer Engineering",
    "Systems Engineering",
  ],
};

export const ACADEMIC_YEARS = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
] as const;
