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
  species_category_id: number;
  threat_category_id: number;
  common_name: string;
  scientific_name: string;
  maori_name: string;
  population_estimate: number;
  year_assessed: number;
}
