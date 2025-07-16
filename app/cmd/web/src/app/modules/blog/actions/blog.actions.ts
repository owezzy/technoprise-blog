import { createActionGroup, props } from '@ngrx/store';
import { BlogPost } from '../models';


export const BlogActions = createActionGroup({
  source: 'Blog Exists Guard',
  events: {
    'Load Blog': props<{ blog: BlogPost }>(),
  },
});
