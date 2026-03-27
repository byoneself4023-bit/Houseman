import { useAppContext } from '@/types/appContext';
import { ASPage } from '../ASPage';

export function ASWrapper() {
  const ctx = useAppContext();

  return (
    <ASPage
      myBuildings={ctx.myBuildings}
    />
  );
}
