import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EnumsService {
  private http = inject(HttpClient);

  /** GET /api/enums/field -> ["INFORMATIQUE", "TELECOM", ...] */
  getFields(): Observable<string[]> {
    return this.http.get<string[]>('/api/enums/field').pipe(shareReplay(1));
  }

  /** GET /api/enums/optioncode -> ["GL", "DS", ...] */
  getOptionCodes(): Observable<string[]> {
    return this.http.get<string[]>('/api/enums/optioncode').pipe(shareReplay(1));
  }

  /** Utility: convert ["A","B"] to [{label:"A",value:"A"}, {label:"B",value:"B"}] for p-select. */
  toOptions(values: string[]): { label: string; value: string }[] {
    return values.map(v => ({ label: v, value: v }));
  }

  /** Convenience streams returning dropdown-ready options */
  getFieldOptions() {
    return this.getFields().pipe(map(v => this.toOptions(v)), shareReplay(1));
  }

  getOptionCodeOptions() {
    return this.getOptionCodes().pipe(map(v => this.toOptions(v)), shareReplay(1));
  }
}
