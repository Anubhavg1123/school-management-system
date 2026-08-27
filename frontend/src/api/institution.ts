import { apiClient as api } from './client';

export const getInstitutionSettings = async () => {
  const response = await api.get('/institution');
  return response.data.data;
};

export const updateInstitutionSettings = async (payload: any) => {
  const response = await api.put('/institution', payload);
  return response.data.data;
};

export const promoteStudentsBatch = async (payload: {
  fromAcademicYearId: string;
  toAcademicYearId: string;
  fromClassId: string;
  toClassId: string;
  remarks?: string;
}) => {
  const response = await api.post('/institution/promote-batch', payload);
  return response.data.data;
};
