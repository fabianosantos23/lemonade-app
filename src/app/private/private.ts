import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { HeaderComponent } from "./components/header/header.component";

@Component({
  selector: 'app-private',
  imports: [RouterOutlet, SideNavComponent, HeaderComponent],
  templateUrl: './private.html',
  styleUrl: './private.scss',
})
export class Private {

}
