import { BlogPost } from '../models';
import {
  createSelector,
  createFeatureSelector,
  combineReducers,
  Action,
} from '@ngrx/store';
import * as fromSearch from './search.reducer';
import * as fromBlogs from './blogs.reducer';
import * as fromCollection from './collection.reducer';
import * as fromBlogDetail from './blog-detail.reducer';
import * as fromBlogEdit from './blog-edit.reducer';

export const blogsFeatureKey = 'blogs';

export interface BlogsState {
  [fromSearch.searchFeatureKey]: fromSearch.State;
  [fromBlogs.blogsFeatureKey]: fromBlogs.State;
  [fromCollection.collectionFeatureKey]: fromCollection.State;
  [fromBlogDetail.blogDetailFeatureKey]: fromBlogDetail.State;
  [fromBlogEdit.blogEditFeatureKey]: fromBlogEdit.State;
}

/** Provide reducer in AoT-compilation happy way */
export function reducers(state: BlogsState | undefined, action: Action) {
  return combineReducers({
    [fromSearch.searchFeatureKey]: fromSearch.reducer,
    [fromBlogs.blogsFeatureKey]: fromBlogs.reducer,
    [fromCollection.collectionFeatureKey]: fromCollection.reducer,
    [fromBlogDetail.blogDetailFeatureKey]: fromBlogDetail.reducer,
    [fromBlogEdit.blogEditFeatureKey]: fromBlogEdit.reducer,
  })(state, action);
}

/**
 * A selector function is a map function factory. We pass it parameters and it
 * returns a function that maps from the larger state tree into a smaller
 * piece of state. This selector simply selects the `blogs` state.
 *
 * Selectors are used with the `select` operator.
 *
 * ```ts
 * class MyComponent {
 *   constructor(state$: Observable<State>) {
 *     this.blogsState$ = state$.pipe(select(getBlogsState));
 *   }
 * }
 * ```
 */

/**
 * The createFeatureSelector function selects a piece of state from the root of the state object.
 * This is used for selecting feature states that are loaded eagerly or lazily.
 */
export const selectBlogsState =
  createFeatureSelector<BlogsState>(blogsFeatureKey);

/**
 * Every reducer module exports selector functions, however child reducers
 * have no knowledge of the overall state tree. To make them usable, we
 * need to make new selectors that wrap them.
 *
 * The createSelector function creates very efficient selectors that are memoized and
 * only recompute when arguments change. The created selectors can also be composed
 * together to select different pieces of state.
 */
export const selectBlogEntitiesState = createSelector(
  selectBlogsState,
  (state) => state.blogs
);

export const selectSelectedBlogId = createSelector(
  selectBlogEntitiesState,
  fromBlogs.selectId
);

/**
 * Adapters created with @ngrx/entity generate
 * commonly used selector functions including
 * getting all ids in the record set, a dictionary
 * of the records by id, an array of records and
 * the total number of records. This reduces boilerplate
 * in selecting records from the entity state.
 */
export const {
  selectIds: selectBlogIds,
  selectEntities: selectBlogEntities,
  selectAll: selectAllBlogs,
  selectTotal: selectTotalBlogs,
} = fromBlogs.adapter.getSelectors(selectBlogEntitiesState);

export const selectSelectedBlog = createSelector(
  selectBlogEntities,
  selectSelectedBlogId,
  (entities, selectedId) => {
    return selectedId && entities[selectedId];
  }
);

/**
 * Just like with the blogs selectors, we also have to compose the search
 * reducer's and collection reducer's selectors.
 */
export const selectSearchState = createSelector(
  selectBlogsState,
  (state) => state.search
);

export const selectSearchBlogIds = createSelector(
  selectSearchState,
  fromSearch.getIds
);
export const selectSearchQuery = createSelector(
  selectSearchState,
  fromSearch.getQuery
);
export const selectSearchLoading = createSelector(
  selectSearchState,
  fromSearch.getLoading
);
export const selectSearchError = createSelector(
  selectSearchState,
  fromSearch.getError
);

export const selectSearchTotalRecords = createSelector(
  selectSearchState,
  fromSearch.getTotalRecords
);

export const selectSearchCurrentPage = createSelector(
  selectSearchState,
  fromSearch.getCurrentPage
);

export const selectSearchPageSize = createSelector(
  selectSearchState,
  fromSearch.getPageSize
);

export const selectSearchTotalPages = createSelector(
  selectSearchState,
  fromSearch.getTotalPages
);

export const selectSearchPaginationMetadata = createSelector(
  selectSearchTotalRecords,
  selectSearchCurrentPage,
  selectSearchPageSize,
  selectSearchTotalPages,
  (totalRecords, currentPage, pageSize, totalPages) => ({
    totalRecords,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  })
);

/**
 * Some selector functions create joins across parts of state. This selector
 * composes the search result IDs to return an array of blogs in the store.
 */
export const selectSearchResults = createSelector(
  selectBlogEntities,
  selectSearchBlogIds,
  (blogs, searchIds) => {
    return searchIds
      .map((id) => blogs[id])
      .filter((blog): blog is BlogPost => blog != null);
  }
);

export const selectCollectionState = createSelector(
  selectBlogsState,
  (state) => state.collection
);

export const selectCollectionLoaded = createSelector(
  selectCollectionState,
  fromCollection.getLoaded
);
export const getCollectionLoading = createSelector(
  selectCollectionState,
  fromCollection.getLoading
);
export const selectCollectionBlogIds = createSelector(
  selectCollectionState,
  fromCollection.getIds
);

export const selectBlogCollection = createSelector(
  selectBlogEntities,
  selectCollectionBlogIds,
  (entities, ids) => {
    return ids
      .map((id) => entities[id])
      .filter((blog): blog is BlogPost => blog != null);
  }
);

export const isSelectedBlogInCollection = createSelector(
  selectCollectionBlogIds,
  selectSelectedBlogId,
  (ids, selected) => {
    return !!selected && ids.indexOf(selected) > -1;
  }
);

/**
 * Blog Detail Selectors
 */
export const selectBlogDetailState = createSelector(
  selectBlogsState,
  (state) => state.blogDetail
);

export const selectBlogDetailBlog = createSelector(
  selectBlogDetailState,
  fromBlogDetail.getBlog
);

export const selectBlogDetailLoading = createSelector(
  selectBlogDetailState,
  fromBlogDetail.getLoading
);

export const selectBlogDetailError = createSelector(
  selectBlogDetailState,
  fromBlogDetail.getError
);

/**
 * Blog Edit Selectors
 */
export const selectBlogEditState = createSelector(
  selectBlogsState,
  (state) => state.blogEdit
);

export const selectBlogEditBlog = createSelector(
  selectBlogEditState,
  fromBlogEdit.getBlog
);

export const selectBlogEditLoading = createSelector(
  selectBlogEditState,
  fromBlogEdit.getLoading
);

export const selectBlogEditSaving = createSelector(
  selectBlogEditState,
  fromBlogEdit.getSaving
);

export const selectBlogEditError = createSelector(
  selectBlogEditState,
  fromBlogEdit.getError
);

export const selectBlogEditUploadingImage = createSelector(
  selectBlogEditState,
  fromBlogEdit.getUploadingImage
);

export const selectBlogEditDeletingImage = createSelector(
  selectBlogEditState,
  fromBlogEdit.getDeletingImage
);

export const selectBlogEditImageUploadError = createSelector(
  selectBlogEditState,
  fromBlogEdit.getImageUploadError
);
