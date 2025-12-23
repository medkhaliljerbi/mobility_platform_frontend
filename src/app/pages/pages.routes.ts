import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
//import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import {HiringDocumentsPageComponent} from './applicaiton/hiring-documents-page.component'
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
import {MyApplicationsPageComponent} from './student/my-applications-page.component';
import {HiringApplicationsPageComponent} from './applicaiton/hiring-applications-page.component';
import { ApplicationProcessPage } from './applicaiton/application-process-page';
import {ApplicationDocumentsPage} from './student/application-documents.page';
import {MobilityContractTemplateComponent} from './mobilityAgent/mobility-contract-template.component';
import { StudentContractSubmissionComponent } from './student/student-contract-submission.component';
import {ChefOptionContractsComponent} from'./teacher/chef-option-contracts.component';
export default [
  { path: 'documentation', component: Documentation },
 // { path: 'crud', component: Crud },
  { path: 'empty', component: Empty },

  { path: 'student/profile', component: StudentProfilePageComponent },
  { path: 'student/profile/documents', component:DocumentsUiComponent},
  { path: 'student/profile/certificates', component:CertificatesUiComponent},
  { path: 'student/apply/:offerId', component: ApplyPageComponent },
  { path: 'student/application/:offerId/process', component: ApplicationProcessPage },
  { path: 'student/application/:offerId/contract', component: StudentContractSubmissionComponent },
  {path: 'student/:offerId/documents',component: ApplicationDocumentsPage},
  {path:'student/myapplications',component:MyApplicationsPageComponent},
  { path: 'teacher/profile', component: TeacherProfilePageComponent },
  { path: 'teacher/recommend/:offerId',component: RecommendStudentsComponent},
  {path: 'teacher/contracts',component:ChefOptionContractsComponent},
  { path: 'partner/profile', component: PartnerProfilePageComponent },
  { path: 'mobilityagent/profile', component: AgentMobiliteProfilePageComponent },
  {path: 'mobilityagent/mobility-contract',component: MobilityContractTemplateComponent},
  { path: 'admin/profile', component: AdminProfilePageComponent },

  { path: 'offer/create', component: OfferCreatePageComponent },
  { path: 'offer/list', component: OfferListComponent },
  { path: 'offer/update/:id', component: OfferUpdatePageComponent },  // main
  {path: 'offer/public', component: PublicOfferListComponent},

  { path: 'hiring/offers/:id', component:  HiringApplicationsPageComponent },
  { path: 'hiring/offers/:id/documents', component: HiringDocumentsPageComponent }, // main
  { path: '**', redirectTo: '/notfound' }
] as Routes;
