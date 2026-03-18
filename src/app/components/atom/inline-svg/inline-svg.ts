import {Component, inject, input, signal, effect} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

const SVG_CACHE = new Map<string, string>();

@Component({
  selector: 'app-inline-svg',
  standalone: true,
  template: `<span [innerHTML]="svgContent()"></span>`,
  styleUrl: './inline-svg.scss',
})
export class InlineSvg {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly src = input.required<string>();

  protected readonly svgContent = signal<SafeHtml>('');

  constructor() {
    effect(onCleanup => {
      const src = this.src();

      if (SVG_CACHE.has(src)) {
        this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(SVG_CACHE.get(src)!));
        return;
      }

      const sub = this.http
        .get(src, {responseType: 'text'})
        .subscribe(svg => {
          SVG_CACHE.set(src, svg);
          this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(svg));
        });

      onCleanup(() => sub.unsubscribe());
    });
  }
}
