import { createReducer, on } from '@ngrx/store';
import { BlogPost } from '../models';
import { BlogEditPageActions } from '../actions/blog-edit-page.actions';
import { BlogEditApiActions } from '../actions/blog-edit-api.actions';

export const blogEditFeatureKey = 'blogEdit';

export interface State {
  blog: BlogPost | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  uploadingImage: boolean;
  imageUploadError: string | null;
}

const initialState: State = {
  blog: null,
  loading: false,
  saving: false,
  error: null,
  uploadingImage: false,
  imageUploadError: null,
};

export const reducer = createReducer(
  initialState,
  // Load blog actions
  on(BlogEditPageActions.loadBlog, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BlogEditApiActions.loadBlogSuccess, (state, { blog }) => ({
    ...state,
    blog,
    loading: false,
    error: null,
  })),
  on(BlogEditApiActions.loadBlogFailure, (state, { error }) => ({
    ...state,
    blog: null,
    loading: false,
    error,
  })),

  // Create new blog
  on(BlogEditPageActions.createNewBlog, (state) => ({
    ...state,
    blog: null,
    loading: false,
    error: null,
  })),

  // Save/Update blog actions
  on(BlogEditPageActions.saveBlog, BlogEditPageActions.updateBlog, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(BlogEditApiActions.saveBlogSuccess, BlogEditApiActions.updateBlogSuccess, (state, { blog }) => ({
    ...state,
    blog,
    saving: false,
    error: null,
  })),
  on(BlogEditApiActions.saveBlogFailure, BlogEditApiActions.updateBlogFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  // Delete blog actions
  on(BlogEditPageActions.deleteBlog, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(BlogEditApiActions.deleteBlogSuccess, (state) => ({
    ...state,
    blog: null,
    saving: false,
    error: null,
  })),
  on(BlogEditApiActions.deleteBlogFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  // Image upload actions
  on(BlogEditPageActions.uploadImage, (state) => ({
    ...state,
    uploadingImage: true,
    imageUploadError: null,
  })),
  on(BlogEditApiActions.uploadImageSuccess, (state, { image }) => ({
    ...state,
    blog: state.blog ? {
      ...state.blog,
      featured_image: image
    } : null,
    uploadingImage: false,
    imageUploadError: null,
  })),
  on(BlogEditApiActions.uploadImageFailure, (state, { error }) => ({
    ...state,
    uploadingImage: false,
    imageUploadError: error,
  })),

  // Image delete actions
  on(BlogEditApiActions.deleteImageSuccess, (state, { imageId }) => ({
    ...state,
    blog: state.blog ? {
      ...state.blog,
      featured_image: undefined
    } : null,
    imageUploadError: null,
  })),
  on(BlogEditApiActions.deleteImageFailure, (state, { error }) => ({
    ...state,
    imageUploadError: error,
  })),

  // Leave page
  on(BlogEditPageActions.leavePage, () => initialState)
);

export const getBlog = (state: State) => state.blog;
export const getLoading = (state: State) => state.loading;
export const getSaving = (state: State) => state.saving;
export const getError = (state: State) => state.error;
export const getUploadingImage = (state: State) => state.uploadingImage;
export const getImageUploadError = (state: State) => state.imageUploadError;
