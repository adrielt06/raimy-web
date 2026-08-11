import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HealthStatus } from './health/health-status';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HealthStatus],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
}
