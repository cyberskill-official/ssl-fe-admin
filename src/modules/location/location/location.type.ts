import type { T_Location } from '#shared/graphql';

export type T_Location_Populate = 'region' | 'subRegion' | 'country' | 'state' | 'city';

export interface I_Input_Location extends Omit<T_Location, T_Location_Populate> {}
