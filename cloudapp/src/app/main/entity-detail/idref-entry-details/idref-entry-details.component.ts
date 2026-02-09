import { Component, computed, inject } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { IdrefService } from '../../../services/idref.service';
@Component({
  selector: 'app-idref-entry-details',
  templateUrl: './idref-entry-details.component.html',
  styleUrl: './idref-entry-details.component.scss'
})
export class IdrefEntryDetailsComponent {
  private idrefService = inject(IdrefService);
  private translate = inject(TranslateService);
  private alert = inject(AlertService);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public idrefAuthorityDetail = this.idrefService.idrefAuthorityDetail;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public xmlAsString = computed(() => {
    const doc = this.idrefAuthorityDetail();

    if (!doc) return '';

    const serializer = new XMLSerializer();

    return serializer.serializeToString(doc);
  });

}
