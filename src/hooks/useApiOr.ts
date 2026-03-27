import { USE_API } from '@/lib/featureFlag';

/**
 * Returns API data when USE_API is true, otherwise falls back to local data.
 * Used in wrapper components to abstract the data source from page components.
 */
export function useApiOr<T>(apiData: unknown, localData: T): T {
  return USE_API ? ((apiData as T) ?? localData) : localData;
}
