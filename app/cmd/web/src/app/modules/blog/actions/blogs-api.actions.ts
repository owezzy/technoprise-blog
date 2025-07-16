import { createActionGroup, props } from '@ngrx/store';
import { BlogPost, BlogResponse } from '../models';


export const BlogsApiActions = createActionGroup({
  source: 'Blogs/API',
  events: {
    'Search Success': props<{ blogs: BlogResponse }>(),
    'Search Failure': props<{ errorMsg: string }>(),
  },
});
