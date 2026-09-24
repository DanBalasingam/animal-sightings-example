export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface ApiResponse {
  message: string;
  status_code: number;
}

export interface UserResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

export interface Specie {
  id: number;
  common_name: string;
  scientific_name: string;
  maori_name: string;
  species_category: string;
  threat_category: string;
  population_estimate: number;
  sightings: number;
}

export interface SpeciesCategory {
  id: number;
  name: string;
}

export interface Terrain {
  id: number;
  name: string;
}

export interface Region {
  region: string;
}
