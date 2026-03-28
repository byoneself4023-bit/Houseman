import { useAuthStore } from '../stores/authStore';
import { initialStaffMembers } from '../config/staff';
import { getStaffBuildings } from '../utils/helpers';

interface Building {
  name: string;
  [key: string]: unknown;
}

export function useMyBuildings(allBuildings: Building[] = []) {
  const loggedInId = useAuthStore(s => s.loggedInId);
  const currentStaff = initialStaffMembers.find(s => s.id === loggedInId);
  const isGeneral = currentStaff?.roles?.includes("general") ?? false;
  const myBuildings = isGeneral
    ? allBuildings.map(b => b.name)
    : getStaffBuildings(currentStaff ?? null);
  return { myBuildings, currentStaff, isGeneral, allBuildings };
}
