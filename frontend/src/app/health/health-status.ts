import { httpResource } from "@angular/common/http";
import { Component } from "@angular/core";
import { environment } from "../../environments/environment";

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

@Component({
  selector: 'app-health-status',
  template: `
    <p role="status" aria-live="polite">
    @if (health.isLoading()) {
        Verificando conexión…
    } @else if (health.error()) {
        Sin conexión con el backend
    } @else {
        Backend: {{ health.value()?.status }}
    }
    </p>
    `,
})
export class HealthStatus {
  protected readonly health = httpResource<HealthResponse>(
    () => `${environment.apiUrl}/health`,
  );
}