import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthorityDetailsService {
  
  public idrefAuthorityDetail = signal<Document | undefined>(undefined);
private http = inject(HttpClient);


  public searchWithPPN(ppn: string): Observable<Document> {
      // this.searchAuthorities(`ppn_z:${ppn}`).subscribe({ next: r => this.idrefResult.set(r) });
  
      return this.http.get(`${environment.idrefUrl}/${ppn}.xml`, { responseType: 'text' }).pipe(
        map((xmlString) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  
          return xmlDoc;
        })
      );
    }

  public loadAuthorityDetail$(ppn: string): Observable<Document> {
      return this.searchWithPPN(ppn).pipe(
        tap((detail) => this.idrefAuthorityDetail.set(detail))
      );
    }

  public reset(): void {
    this.idrefAuthorityDetail.set(undefined);
  }
}
