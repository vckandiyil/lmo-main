import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class FilterStateService {
  readonly selectedTopic = signal<string | null>(null);
}
