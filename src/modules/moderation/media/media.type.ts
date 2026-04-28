import type { T_Omit_Create, T_Omit_Update } from '@cyberskill/shared/node/mongo';

import type { E_ModerationMediaType, E_NoteType, T_ModerationMedia, T_Note } from '#shared/graphql';

export type T_ModerationMedia_Populate = 'uploadedBy' | 'moderatedBy';

export interface I_Input_QueryModerationMedia extends Omit<T_ModerationMedia, T_ModerationMedia_Populate> {
    notes?: I_Input_Note[];
}

export interface I_Input_CreateModerationMedia extends Omit<T_ModerationMedia, T_Omit_Create | T_ModerationMedia_Populate> {
    type: E_ModerationMediaType;
    uploadedById: string;
    url: string;
    notes?: I_Input_Note[];
}

export interface I_Input_UpdateModerationMedia extends Omit<T_ModerationMedia, T_Omit_Update | T_ModerationMedia_Populate> {
    notes?: I_Input_Note[];
}

export type T_Note_Populate = 'createdBy';

export interface I_Input_Note extends Omit<T_Note, T_Note_Populate> {
    type: E_NoteType;
    content: string;
}

export interface I_Input_ApproveModerationMedia extends Pick<T_ModerationMedia, 'id'> {
    id: string;
}
export interface I_Input_RejectModerationMedia extends Pick<T_ModerationMedia, 'id' | 'reason'> {
    id: string;
    reason: string;
}
