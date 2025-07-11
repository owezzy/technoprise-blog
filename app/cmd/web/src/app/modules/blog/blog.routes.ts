import { Routes } from '@angular/router';
import { BlogContainerComponent } from 'app/modules/blog/blog.container';
import { BlogDetailComponent } from 'app/modules/blog/blog-detail.component';
import { BlogEditComponent } from 'app/modules/blog/blog-edit.component';

export default [
    {
        path     : '',
        component: BlogContainerComponent,
    },
    {
        path     : 'new',
        component: BlogEditComponent,
    },
    {
        path     : 'edit/:id',
        component: BlogEditComponent,
    },
    {
        path     : ':slug',
        component: BlogDetailComponent,
    },
] as Routes;