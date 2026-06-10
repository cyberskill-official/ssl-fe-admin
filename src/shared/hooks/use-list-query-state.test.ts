// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
    createBooleanQueryParam,
    createEnumQueryParam,
    createIntegerQueryParam,
    createStringQueryParam,
    mergeListQueryState,
    parseListQueryState,
    serializeListQueryState,
} from './use-list-query-state';

const PAGE_SIZES = [10, 25, 50, 100] as const;
const TEST_CONFIG = {
    page: createIntegerQueryParam(1),
    pageSize: createIntegerQueryParam(10, { allowedValues: PAGE_SIZES }),
    q: createStringQueryParam(),
    sort: createEnumQueryParam('createdAt-desc', ['createdAt-desc', 'createdAt-asc'] as const),
    custom: createBooleanQueryParam(),
};

describe('list query state helpers', () => {
    it('falls back for invalid values and serializes only non-default state', () => {
        const input = new URLSearchParams('page=-2&pageSize=500&sort=unknown&custom=yes&other=kept');
        const state = parseListQueryState(input, TEST_CONFIG);

        expect(state).toEqual({
            page: 1,
            pageSize: 10,
            q: '',
            sort: 'createdAt-desc',
            custom: false,
        });

        const serialized = serializeListQueryState(input, TEST_CONFIG, {
            ...state,
            page: 3,
            q: 'guide',
            custom: true,
        });

        expect(serialized.toString()).toBe('page=3&custom=1&other=kept&q=guide');
    });

    it('resets page for filter changes but preserves it for view-only changes', () => {
        const state = parseListQueryState(new URLSearchParams('page=3&q=old'), TEST_CONFIG);

        expect(mergeListQueryState(state, { q: 'new' }, TEST_CONFIG, true)).toMatchObject({
            page: 1,
            q: 'new',
        });
        expect(mergeListQueryState(state, { custom: true }, TEST_CONFIG, false)).toMatchObject({
            page: 3,
            custom: true,
        });
    });
});
