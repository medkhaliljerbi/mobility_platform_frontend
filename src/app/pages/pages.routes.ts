import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';

import { StudentProfilePageComponent } from './student/profile.page';
import { CertificatesUiComponent } from './student/certificates-ui.component';
import { DocumentsUiComponent } from './student/documents-ui.component';
import { TeacherProfilePageComponent } from './teacher/profile.page';
import { PartnerProfilePageComponent } from './partnerSchool/profile.page';
import { AgentMobiliteProfilePageComponent } from './mobilityAgent/profile.page';
import { AdminProfilePageComponent } from './admin/admin-profile-page.component';
import {ApplyPageComponent}from './applicaiton/application-page';
import { OfferCreatePageComponent } from './offer/offer-create-page.component';
import { OfferListComponent } from './offer/offer-list-page-component';
import { OfferUpdatePageComponent } from './offer/offer-update-page.component'; // <-- NEW
import {PublicOfferListComponent} from './offer/public-offer-list.component';
import {RecommendStudentsComponent} from './teacher/recommend-students.component';
export default [
  { path: 'documentation', component: Documentation },
  { path: 'crud', component: Crud },
  { path: 'empty', component: Empty },

  { path: 'student/profile', component: StudentProfilePageComponent },
  { path: 'student/profile/documents', component:DocumentsUiComponent},
  { path: 'student/profile/certificates', component:CertificatesUiComponent},
  { path: 'student/apply/:offerId', component: ApplyPageComponent },
  { path: 'teacher/profile', component: TeacherProfilePageComponent },
  { path: 'teacher/recommend/:offerId',component: RecommendStudentsComponent},
  { path: 'partner/profile', component: PartnerProfilePageComponent },
  { path: 'mobilityagent/profile', component: AgentMobiliteProfilePageComponent },
  { path: 'admin/profile', component: AdminProfilePageComponent },

  { path: 'offer/create', component: OfferCreatePageComponent },
  { path: 'offer/list', component: OfferListComponent },
  { path: 'offer/update/:id', component: OfferUpdatePageComponent },  // main
  {path: 'offer/public', component: PublicOfferListComponent},

  { path: '**', redirectTo: '/notfound' }
] as Routes;
