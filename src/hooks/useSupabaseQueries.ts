import { useQuery } from '@tanstack/react-query';
import { fetchBuildings, fetchRooms, fetchTenants, fetchAllData } from '../lib/supabaseData';

export function useSupabaseBuildings() {
  return useQuery({ queryKey: ['supabase-buildings'], queryFn: fetchBuildings });
}

export function useSupabaseRooms() {
  return useQuery({ queryKey: ['supabase-rooms'], queryFn: fetchRooms });
}

export function useSupabaseTenants() {
  return useQuery({ queryKey: ['supabase-tenants'], queryFn: fetchTenants });
}

export function useAllSupabaseData() {
  return useQuery({ queryKey: ['all-supabase-data'], queryFn: fetchAllData });
}
