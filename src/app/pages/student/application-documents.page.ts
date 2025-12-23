import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { OfferService } from '@/core/services/offer.service';
import { StudentService } from '@/core/services/student.service';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-application-documents',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    ButtonModule, InputTextModule,
    InputGroupModule, InputGroupAddonModule,
    ToastModule, SelectModule
  ],
  providers: [MessageService],
  template: `

<p-toast></p-toast>

<div class="page">
  <div class="shell">

    <h2>Required Documents</h2>

    <ng-container *ngIf="offer() && app(); else loading">

      <!-- NO REQUIRED DOCS -->
      <ng-container *ngIf="offer()?.requiredDocs?.length === 0">
        <div class="doc-row disabled">
          <div class="label">No Required Documents</div>
          <input pInputText disabled placeholder="Nothing to upload" />
        </div>
        <hr class="sep" />
      </ng-container>

      <!-- REQUIRED DOCS -->
      <ng-container *ngIf="offer()?.requiredDocs?.length > 0">

        <div class="doc-row" *ngFor="let doc of offer()?.requiredDocs">
          <div class="label">
            {{ doc }}
            <span *ngIf="app()?.requiredDocsJson?.[doc]" class="current-file">
              ✓ Attached
            </span>
          </div>

          <div class="col">

            <!-- Upload new file -->
            <p-inputgroup class="filegroup">
              <input
                type="file"
                class="file-input"
                (change)="selectRequiredDoc($event, doc)"
              />

              <!-- Choose existing profile document -->
              <p-inputgroup-addon>
                <p-select
                  [options]="profileDocs()"
                  optionLabel="fileName"
                  optionValue="id"
                  placeholder="My Documents"
                  (onChange)="selectExistingDoc($event.value, doc)"
                  styleClass="small-select"
                ></p-select>
              </p-inputgroup-addon>

              <!-- Choose existing certificate -->
              <p-inputgroup-addon>
                <p-select
                  [options]="profileCerts()"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="My Certificates"
                  (onChange)="selectExistingCert($event.value, doc)"
                  styleClass="small-select"
                ></p-select>
              </p-inputgroup-addon>

              <!-- Upload -->
              <p-inputgroup-addon>
                <button pButton label="Upload"
                        class="p-button-sm p-button-success"
                        (click)="uploadRequired(doc)">
                </button>
              </p-inputgroup-addon>

              <!-- Delete -->
              <p-inputgroup-addon>
                <button pButton icon="pi pi-trash"
                        class="p-button-sm p-button-danger"
                        [disabled]="!hasRequired(doc)"
                        (click)="deleteRequired(doc)">
                </button>
              </p-inputgroup-addon>

              <!-- Download -->
              <p-inputgroup-addon *ngIf="app()?.requiredDocsJson?.[doc]">
                <button pButton icon="pi pi-download"
                        class="p-button-sm"
                        (click)="downloadRequired(doc)">
                </button>
              </p-inputgroup-addon>

            </p-inputgroup>

          </div>
        </div>

        <hr class="sep" />
      </ng-container>


      <!-- CERTIFICATIONS -->
      <h2>Certifications</h2>

      <div class="doc-row" *ngFor="let cert of certKeys()">

        <div class="label">{{ cert }}</div>

        <div class="col">
          <p-inputgroup class="filegroup">
            <input type="file" class="file-input"
                   (change)="selectCert($event, cert)" />

            <p-inputgroup-addon>
              <p-select
                [options]="profileCerts()"
                optionLabel="name"
                optionValue="id"
                placeholder="Choose"
                (onChange)="selectExistingCertForCert($event.value, cert)"
                styleClass="small-select"
              ></p-select>
            </p-inputgroup-addon>

            <p-inputgroup-addon>
              <button pButton label="Upload"
                      class="p-button-sm p-button-success"
                      (click)="uploadCert(cert)">
              </button>
            </p-inputgroup-addon>

            <p-inputgroup-addon>
              <button pButton icon="pi pi-trash"
                      class="p-button-danger p-button-sm"
                      (click)="deleteCert(cert)">
              </button>
            </p-inputgroup-addon>

            <p-inputgroup-addon *ngIf="app()?.certificationsJson?.[cert]">
              <button pButton icon="pi pi-download"
                      class="p-button-sm"
                      (click)="downloadCert(cert)">
              </button>
            </p-inputgroup-addon>
          </p-inputgroup>
        </div>

      </div>

      <button pButton label="Add Certification"
              class="p-button-sm p-button-info add-cert"
              (click)="addCertification()">
      </button>

      <hr class="sep" />


      <!-- SUBMIT BUTTONS -->
      <div class="actions">
        <button pButton label="Submit Documents"
                class="p-button-success"
                (click)="submit()"></button>

        <button pButton label="Back"
                class="p-button-secondary"
                (click)="back()"></button>
      </div>

    </ng-container>

    <ng-template #loading>Loading…</ng-template>

  </div>
</div>

  `,
  styles: [`
.page { display:flex; justify-content:center; padding:1.5rem; }
.shell {
  width:100%; max-width:900px; background:white; padding:2rem;
  border-radius:.6rem; box-shadow:0 3px 12px rgba(0,0,0,.1);
}
.doc-row {
  display:grid; grid-template-columns: 200px 1fr;
  align-items:center; margin-bottom:1.2rem;
}
.label { font-weight:600; }
.col { width:100%; }
.small-select ::ng-deep .p-dropdown-label { font-size: 12px; }
.filegroup { width:100%; }
.file-input { width:100%; border:1px solid #ddd; padding:.4rem; border-radius:4px; }
.sep { margin:2rem 0; border-top:1px solid #e5e7eb; }
.actions { display:flex; justify-content:center; gap:1rem; }
.add-cert { margin-top:1rem; }
.current-file { font-size:12px; color:green; }
.disabled { opacity:.6; }
  `]
})
export class ApplicationDocumentsPage implements OnInit {

  private route = inject(ActivatedRoute);
  private offers = inject(OfferService);
  private student = inject(StudentService);
  private router = inject(Router);
  private toast = inject(MessageService);

  offer = signal<any>(null);
  app = signal<any>(null);

  requiredFiles = new Map<string, File>();
  certFiles = new Map<string, File>();

  existingDocs = new Map<string, number>(); // label → documentId
  existingCerts = new Map<string, number>(); // label → certId for required docs
  existingCertsForCert = new Map<string, number>(); // label → certId for certifications

  profileDocs = signal<any[]>([]);
  profileCerts = signal<any[]>([]);
  certIndex = 1;

  ngOnInit() {
    const offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    this.offers.getOffer(offerId).subscribe(o => this.offer.set(o));

    this.offers.getApplicationProcess(offerId).subscribe(a => {
      if (!a) return;
      this.app.set({
        applicationId: a.applicationId,
        requiredDocsJson: a.requiredDocsJson ?? {},
        certificationsJson: a.certificationsJson ?? {}
      });
    });

    // Load user's existing docs/certs
    this.student.listDocuments().subscribe(d => this.profileDocs.set(d));
    this.student.listCertificates().subscribe(c => this.profileCerts.set(c));
  }


  /** REQUIRED DOCS */
  hasRequired(doc: string) {
    return !!this.app()?.requiredDocsJson?.[doc];
  }

  selectRequiredDoc(ev: any, label: string) {
    const f = ev.target.files?.[0];
    if (f) {
      this.requiredFiles.set(label, f);
      this.existingDocs.delete(label);
    }
  }

  selectExistingDoc(docId: number, label: string) {
    this.existingDocs.set(label, docId);
    this.requiredFiles.delete(label);
  }

  selectExistingCert(certId: number, label: string) {
    this.existingCerts.set(label, certId);
    this.requiredFiles.delete(label);
  }

  uploadRequired(label: string) {
    const appId = this.app().applicationId;
    const file = this.requiredFiles.get(label);
    const docId = this.existingDocs.get(label);
    const certId = this.existingCerts.get(label);

    this.offers.uploadRequiredDocument(appId, label, file, docId ?? certId ?? undefined)
      .subscribe(() => {
        this.toast.add({ severity: 'success', summary: 'Uploaded', detail: label });
      });
  }

  deleteRequired(label: string) {
    const appId = this.app().applicationId;
    this.offers.deleteRequiredDocument(appId, label)
      .subscribe(() => {
        delete this.app().requiredDocsJson[label];
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: label });
      });
  }

  downloadRequired(label: string) {
    const appId = this.app().applicationId;
    const url = this.app().requiredDocsJson[label];
    window.open(url, "_blank");
  }


  /** CERTIFICATIONS */
  certKeys() {
    return Object.keys(this.app()?.certificationsJson ?? {});
  }

  addCertification() {
    const key = `Certification ${this.certIndex++}`;
    this.app().certificationsJson[key] = null;
  }

  selectCert(ev: any, label: string) {
    const f = ev.target.files?.[0];
    if (f) {
      this.certFiles.set(label, f);
      this.existingCertsForCert.delete(label);
    }
  }

  selectExistingCertForCert(id: number, label: string) {
    this.existingCertsForCert.set(label, id);
    this.certFiles.delete(label);
  }

  uploadCert(label: string) {
    const appId = this.app().applicationId;
    const file = this.certFiles.get(label);
    const existingId = this.existingCertsForCert.get(label);

    this.offers.uploadCertification(appId, label, file, existingId)
      .subscribe(() => {
        this.toast.add({ severity: 'success', summary: 'Uploaded', detail: label });
      });
  }

  deleteCert(label: string) {
    const appId = this.app().applicationId;
    this.offers.deleteCertification(appId, label)
      .subscribe(() => {
        delete this.app().certificationsJson[label];
      });
  }

  downloadCert(label: string) {
    const url = this.app().certificationsJson[label];
    window.open(url, "_blank");
  }


  /** FINAL SUBMIT */
  submit() {
    const id = this.app().applicationId;

    this.offers.submitAllDocuments(id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Submitted' });
        this.router.navigate(['/pages/student/application', this.offer().id, 'process']);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Missing required docs' });
      }
    });
  }

  back() { history.back(); }
}
