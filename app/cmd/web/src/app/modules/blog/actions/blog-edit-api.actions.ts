import { createActionGroup, props } from '@ngrx/store';
import { BlogPost, BlogImage } from '../models';

export const BlogEditApiActions = createActionGroup({
  source: 'Blog Edit API',
  events: {
    'Load Blog Success': props<{ blog: BlogPost }>(),
    'Load Blog Failure': props<{ error: string }>(),
    'Save Blog Success': props<{ blog: BlogPost }>(),
    'Save Blog Failure': props<{ error: string }>(),
    'Update Blog Success': props<{ blog: BlogPost }>(),
    'Update Blog Failure': props<{ error: string }>(),
    'Delete Blog Success': props<{ id: number }>(),
    'Delete Blog Failure': props<{ error: string }>(),
    'Upload Image Success': props<{ image: BlogImage }>(),
    'Upload Image Failure': props<{ error: string }>(),
    'Delete Image Success': props<{ imageId: number }>(),
    'Delete Image Failure': props<{ error: string }>(),
  },
});