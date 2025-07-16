import { createActionGroup, props } from '@ngrx/store';
import { BlogPost, BlogResponse } from '../models';


export const CollectionApiActions = createActionGroup({
  source: 'Collection/API',
  events: {
    /**
     * Add Blog to Collection Actions
     */
    'Add Blog Success': props<{ blog: BlogPost }>(),
    'Add Blog Failure': props<{ blog: BlogPost }>(),

    /**
     * Remove Blog from Collection Actions
     */
    'Remove Blog Success': props<{ blog: BlogPost }>(),
    'Remove Blog Failure': props<{ blog: BlogPost }>(),

    /**
     * Load Collection Actions
     */
    'Load Blogs Success': props<{ blogs: BlogResponse }>(),
    'Load Blogs Failure': props<{ error: any }>(),
  },
});
