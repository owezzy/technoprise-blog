import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { BlogPost } from '../models';

export const BlogEditPageActions = createActionGroup({
  source: 'Blog Edit Page',
  events: {
    'Load Blog': props<{ id: number }>(),
    'Create New Blog': emptyProps(),
    'Save Blog': props<{ blog: Partial<BlogPost> }>(),
    'Update Blog': props<{ id: number; blog: Partial<BlogPost> }>(),
    'Delete Blog': props<{ id: number }>(),
    'Upload Image': props<{ file: File , id:number}>(),
    'Delete Image': props<{ imageId: number }>(),
    'Leave Page': emptyProps(),
  },
});
