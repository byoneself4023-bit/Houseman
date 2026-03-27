import { useAppContext } from '@/types/appContext';
import { ASPage as _ASPage } from '../ASPage';

const ASPage: React.ComponentType<any> = _ASPage;

export function ASWrapper() {
  const ctx = useAppContext();

  return (
    <ASPage
      myBuildings={ctx.myBuildings}
    />
  );
}
