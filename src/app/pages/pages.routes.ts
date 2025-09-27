import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import {StudentProfilePageComponent} from './student/profile.page'
export default [
  { path: 'documentation', component: Documentation },
  { path: 'crud', component: Crud },
  { path: 'empty', component: Empty },

  { path: 'student/profile', component: StudentProfilePageComponent },

  { path: '**', redirectTo: '/notfound' }
] as Routes;
