import { createActionGroup, props } from '@ngrx/store';

export const ViewBlogPageActions = createActionGroup({
  source: 'View Blog Page',
  events: {
    'Select Blog': props<{ id: string }>(),
  },
});
