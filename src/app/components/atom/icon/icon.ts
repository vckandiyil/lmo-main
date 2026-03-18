import {Component, inject, input, signal, effect} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

const SVG_CACHE = new Map<string, string>();

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="icon" [style.color]="color()" [innerHTML]="svgContent()"></span>`,
  styleUrl: './icon.scss',
})
export class Icon {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly color = input<string>('currentColor');
  readonly size = input<string>('20');

  protected readonly svgContent = signal<SafeHtml>('');

  constructor() {
    effect(onCleanup => {
      const name = this.name();
      const size = this.size();

      if (SVG_CACHE.has(name)) {
        this.svgContent.set(this.processSvg(SVG_CACHE.get(name)!, size));
        return;
      }

      const sub = this.http
        .get(`assets/images/icons/${name}.svg`, {responseType: 'text'})
        .subscribe(svg => {
          SVG_CACHE.set(name, svg);
          this.svgContent.set(this.processSvg(svg, size));
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  private processSvg(raw: string, size: string): SafeHtml {
    const svg = raw
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`)
      .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"')
      .replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
