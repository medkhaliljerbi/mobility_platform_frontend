import { Routes } from '@angular/router';

import { UsersListComponent } from './admin/users-list';
import {InviteNewStudentsComponent} from './admin/invite-new-students.component';
import {RecommendationsPageComponent} from './recommnedation/recommendations-page.component';
import {OfferViewPageComponent} from './recommnedation/offer-view-page.component';
export default [

    { path: 'users-list', data: { breadcrumb: 'Users List' }, component: UsersListComponent },
    {path:'invite-students',component:InviteNewStudentsComponent},
    {path:'recommendation',component:RecommendationsPageComponent},
    { path: 'view/:id', component: OfferViewPageComponent },
    { path: '**', redirectTo: '/notfound' }

] as Routes;
