import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';

import { StudentProfilePageComponent } from './student/profile.page';
import { TeacherProfilePageComponent } from './teacher/profile.page';
import { PartnerProfilePageComponent } from './partnerSchool/profile.page';
import { AgentMobiliteProfilePageComponent } from './mobilityAgent/profile.page';
import {AdminProfilePageComponent} from './admin/admin-profile-page.component'
export default [
  { path: 'documentation', component: Documentation },
  { path: 'crud', component: Crud },
  { path: 'empty', component: Empty },

  { path: 'student/profile', component: StudentProfilePageComponent },
  { path: 'teacher/profile', component: TeacherProfilePageComponent },
  { path: 'partner/profile', component: PartnerProfilePageComponent },       // ✅ fixed
  { path: 'mobilityagent/profile', component: AgentMobiliteProfilePageComponent }, // ✅ fixed
{ path: 'admin/profile', component: AdminProfilePageComponent },
  { path: '**', redirectTo: '/notfound' }
] as Routes;
