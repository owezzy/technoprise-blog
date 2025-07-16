import { createActionGroup, props, emptyProps } from '@ngrx/store';

export const BlogDetailPageActions = createActionGroup({
  source: 'Blog Detail Page',
  events: {
    'Load Blog': props<{ slug: string }>(),
    'Leave Page': emptyProps(),
  },
});