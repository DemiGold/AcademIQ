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
    "Actuarial Science",
    "Business Administration",
    "ERHRM",
    "Finance",
    "Insurance",
    "Taxation",
    "Procurement",
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

// Contact
export const WHATSAPP_NUMBER = "2347078652616";
export const WHATSAPP_HELP_MESSAGE = "Hi! I have a question about AcademIQ.";
export const WHATSAPP_TOKEN_MESSAGE = "Hi! I'd like to get an AcademIQ premium token.";
