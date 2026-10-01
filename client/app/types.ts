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

export interface Sighting {
  id: number;
  num_seen: number;
  notes: string;
  sighting_datetime: string;
  created_at: string;
  common_name: string;
  scientific_name: string;
  maori_name?: string;
  population_estimate: number;
  year_assessed: number;
  species_category: string;
  threat_category: string;
  location_name: string;
  latitude: number;
  longitude: number;
  region: string;
  sighting_image?: string;
  observer_name?: string;
  terrain_features: string;
}

export interface Count {
  users_count: number;
  species_count: number;
  sightings_count: number;
  region_count: number;
}
