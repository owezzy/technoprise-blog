import {createActionGroup, emptyProps, props} from '@ngrx/store';

export const FindBlogPageActions = createActionGroup({
  source: 'Find Blog Page',
  events: {
    'Search Blogs': props<{ query?: string; page?: number; pageSize?: number; updateUrl?: boolean }>(),
    'Change Page': props<{query?: string; page: number; pageSize: number; updateUrl?: boolean }>(),
    'Load From URL': props<{ query: string; page: number; pageSize: number }>(),
    'Clear Error': emptyProps(),
  },
});
