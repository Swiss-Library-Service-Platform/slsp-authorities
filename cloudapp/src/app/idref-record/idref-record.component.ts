import { Component, inject } from '@angular/core';
import { IdrefService } from '../services/idref.service';

@Component({
  selector: 'app-idref-record',
  templateUrl: './idref-record.component.html',
  styleUrl: './idref-record.component.scss'
})

//Composant qui sert à afficher les notices renvoyés par les recherches idref
export class IdrefRecordComponent {
  private idrefService = inject(IdrefService);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public idrefResult = this.idrefService.idrefResult;
}
