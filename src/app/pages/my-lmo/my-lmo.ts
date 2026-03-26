import {Component, ViewChild} from '@angular/core';
import {Sidebar} from '../../components/organism/sidebar/sidebar';
import {Icon} from '../../components/atom/icon/icon';
import {Filters} from '../../components/organism/filters/filters';
import {LmiBar} from '../../components/organism/lmi-bar/lmi-bar';

@Component({
  selector: 'app-my-lmo',
  standalone: true,
  imports: [Sidebar, Icon, Filters, LmiBar],
  templateUrl: './my-lmo.html',
  styleUrl: './my-lmo.scss',
})
export class MyLmoPage {
  @ViewChild(Sidebar) private sidebarRef!: Sidebar;

  openWidgetCenter(): void {
    this.sidebarRef.openWidgetCenter('left');
  }
}
