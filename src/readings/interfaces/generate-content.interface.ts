export interface GenerateContentI {
  detailReadingId: string;
  numberOfImages: number;
  courseStudentId: string;
  autogenerateActivities: boolean;
  generateFrontPage: boolean;
  processId: string;
}

export interface GenerateProgressI {
  total: number;
  current: number;
}
