import { apiClient } from './client';
import { Appointment, Breed, Examination, PaginatedResult, Pet, Species } from '@/types/models';

export const speciesApi = {
  list: () => apiClient.get<Species[]>('/species').then((r) => r.data),
  breedsFor: (speciesId: string) =>
    apiClient.get<Breed[]>(`/species/${speciesId}/breeds`).then((r) => r.data),
};

export interface PetTimelineEntry {
  id: string;
  startAt: string;
  status: string;
  priorityColor: string | null;
  doctor?: { fullName: string };
  examination?: Examination;
}

export const petsApi = {
  mine: () => apiClient.get<Pet[]>('/pets/mine').then((r) => r.data),
  getOne: (id: string) => apiClient.get<Pet>(`/pets/${id}`).then((r) => r.data),
  search: (params: { page?: number; limit?: number; search?: string; ownerId?: string }) =>
    apiClient.get<PaginatedResult<Pet>>('/pets', { params }).then((r) => r.data),
  create: (payload: Record<string, unknown>) => apiClient.post<Pet>('/pets', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Pet>) =>
    apiClient.patch<Pet>(`/pets/${id}`, payload).then((r) => r.data),
  timeline: (id: string) => apiClient.get<PetTimelineEntry[]>(`/pets/${id}/timeline`).then((r) => r.data),
  appointments: (id: string) =>
    apiClient.get<Appointment[]>('/appointments/mine').then((r) => r.data.filter((a) => a.petId === id)),
};
