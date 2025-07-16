import { createActionGroup, props } from '@ngrx/store';
import { BlogPost } from '../models';

export const BlogDetailApiActions = createActionGroup({
  source: 'Blog Detail API',
  events: {
    'Load Blog Success': props<{ blog: BlogPost }>(),
    'Load Blog Failure': props<{ error: string }>(),
  },
});