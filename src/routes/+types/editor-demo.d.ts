import type { ActionFunctionArgs as BaseActionArgs, LoaderFunctionArgs as BaseLoaderArgs, MetaArgs as BaseMetaArgs } from 'react-router';

export namespace Route {
    export type MetaArgs = BaseMetaArgs;
    export type LoaderArgs = BaseLoaderArgs;
    export type ActionArgs = BaseActionArgs;
    export interface ComponentProps {}
}
