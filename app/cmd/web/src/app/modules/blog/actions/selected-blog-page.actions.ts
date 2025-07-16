import { createActionGroup, props } from '@ngrx/store';
import { BlogPost } from '../models';


export const SelectedBlogPageActions = createActionGroup({
  source: 'Selected Blog Page',
  events: {
    /**
     * Add Blog to Collection Action
     */
    'Add Blog': props<{ blog: BlogPost }>(),

    /**
     * Remove Blog from Collection Action
     */
    'Remove Blog': props<{ blog: BlogPost }>(),
  },
});
