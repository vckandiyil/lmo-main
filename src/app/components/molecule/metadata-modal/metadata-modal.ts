import {Component, input, output, signal} from '@angular/core';
import {Icon} from '../../atom/icon/icon';
import type {MetaDataItem} from '../../../core';

@Component({
  selector: 'app-metadata-modal',
  standalone: true,
  imports: [Icon],
  templateUrl: './metadata-modal.html',
  styleUrl: './metadata-modal.scss'
})
export class MetadataModal {
  readonly isOpen = input<boolean>(false);
  readonly items = input<MetaDataItem[]>([]);
  readonly closed = output<void>();

  readonly isClosing = signal(false);

  onBackdropClick(): void {
    this.close();
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closed.emit();
    }, 300);
  }
}
