import { Component, ElementRef, isDevMode, signal, ViewChild } from '@angular/core';

const CONTACT_WEBHOOK = isDevMode()
  ? '/api/contact'
  : 'https://n8n.innovalaus.com/webhook/lead-routes-landing';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App {
  @ViewChild('contactDialog') private contactDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('contactForm') private contactForm?: ElementRef<HTMLFormElement>;

  readonly interest = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  openContact(interest: string): void {
    this.interest.set(interest);
    this.sent.set(false);
    this.error.set('');
    this.contactDialog.nativeElement.showModal();
  }

  closeContact(): void {
    if (!this.sending()) this.contactDialog.nativeElement.close();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.contactDialog.nativeElement) this.closeContact();
  }

  onDialogCancel(event: Event): void {
    if (this.sending()) event.preventDefault();
  }

  onDialogClose(): void {
    this.contactForm?.nativeElement.reset();
    this.error.set('');
  }

  async submitContact(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.sending()) return;

    const form = event.currentTarget as HTMLFormElement;
    const requiredInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[required]'));
    for (const input of requiredInputs) {
      input.setCustomValidity(input.value.trim() ? '' : 'Completa este campo.');
    }
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const payload = {
      nombre_contacto: String(values.get('nombre_contacto') ?? '').trim(),
      nif: String(values.get('nif') ?? '').trim().toUpperCase(),
      correo: String(values.get('correo') ?? '').trim(),
      telefono: String(values.get('telefono') ?? '').trim(),
      interes: this.interest(),
    };

    this.sending.set(true);
    this.error.set('');
    try {
      const response = await fetch(CONTACT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Webhook responded with ${response.status}`);
      this.sent.set(true);
    } catch {
      this.error.set('No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.');
    } finally {
      this.sending.set(false);
    }
  }

  clearFieldValidity(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) input.setCustomValidity('');
  }
}
