import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  // Instantiating ThemeService here activates its app-wide effect that keeps the
  // `dark` class on <html> in sync with the resolved theme.
  private readonly theme = inject(ThemeService);
}
