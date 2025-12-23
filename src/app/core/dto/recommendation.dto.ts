// src/app/core/dto/recommendation.dto.ts

export interface TeacherRecommendationView {
  recommendationId: number;

  studentId: number;
  studentIdentifier: string | null;
  studentFullName: string;
  studentEmail: string;

  offerId: number;
  offerTitle: string;

  applicationId?: number | null;
  applicationStatus?: string | null;

  message: string;
}

export interface StudentRecommendationView {
  recommendationId: number;

  offerId: number;
  offerTitle: string;

  applicationId?: number | null;
  applicationStatus?: string | null;

  teacherId: number;
  teacherFullName: string;
  teacherEmail: string;

  message: string;
}
