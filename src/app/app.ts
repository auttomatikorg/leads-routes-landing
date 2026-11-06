import { afterNextRender, Component, DestroyRef, ElementRef, inject, isDevMode, signal, ViewChild } from '@angular/core';

const CONTACT_WEBHOOK = isDevMode()
  ? '/api/contact'
  : 'https://n8n.innovalaus.com/webhook/lead-routes-landing';

/* Escena de portada: cuánto dura cada paso (ms). Paso 0 = en reposo;
   1 entra el lead; 2 sale el mensaje automático; 3 botones; 4 el lead
   responde; 5 condición y etiqueta; 6 rama «sí»; 7 lead preparado. */
const HERO_STEP_MS = [900, 1000, 1500, 1200, 1300, 1300, 1100, 4400];
const HERO_LAST_STEP = HERO_STEP_MS.length - 1;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App {
  @ViewChild('contactDialog') private contactDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('contactForm') private contactForm?: ElementRef<HTMLFormElement>;
  @ViewChild('heroFlow') private heroFlow?: ElementRef<HTMLElement>;

  readonly heroStep = signal(0);

  readonly interest = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  readonly footerSending = signal(false);
  readonly footerSent = signal(false);
  readonly footerError = signal('');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const scene = this.heroFlow?.nativeElement;
      if (!scene || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.heroStep.set(HERO_LAST_STEP);
        return;
      }

      let timer: ReturnType<typeof setTimeout> | undefined;
      const run = () => {
        timer = setTimeout(() => {
          this.heroStep.update((step) => (step + 1) % HERO_STEP_MS.length);
          run();
        }, HERO_STEP_MS[this.heroStep()]);
      };
      const pause = () => {
        clearTimeout(timer);
        timer = undefined;
      };

      // Arranca ya y se pausa mientras la portada no está a la vista.
      run();
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) pause();
        else if (timer === undefined) run();
      });
      observer.observe(scene);
      destroyRef.onDestroy(() => {
        pause();
        observer.disconnect();
      });
    });
  }

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

  async submitContact(event: SubmitEvent, source: 'modal' | 'footer' = 'modal'): Promise<void> {
    event.preventDefault();
    const sending = source === 'footer' ? this.footerSending : this.sending;
    const sent = source === 'footer' ? this.footerSent : this.sent;
    const error = source === 'footer' ? this.footerError : this.error;
    if (sending()) return;

    const form = event.currentTarget as HTMLFormElement;
    const requiredInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[required]'));
    for (const input of requiredInputs) {
      input.setCustomValidity(input.type === 'checkbox'
        ? (input.checked ? '' : 'Acepta la Política de privacidad y los Términos y condiciones.')
        : (input.value.trim() ? '' : 'Completa este campo.'));
    }
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const payload = {
      nombre_contacto: String(values.get('nombre_contacto') ?? '').trim(),
      nif: String(values.get('nif') ?? '').trim().toUpperCase(),
      correo: String(values.get('correo') ?? '').trim(),
      telefono: String(values.get('telefono') ?? '').trim(),
      interes: source === 'footer' ? 'Solicitud de demo desde el pie de página' : this.interest(),
      acepta_newsletter: values.has('acepta_newsletter'),
      acepta_politica_y_terminos: values.has('acepta_politica_y_terminos'),
    };

    sending.set(true);
    error.set('');
    try {
      const response = await fetch(CONTACT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Webhook responded with ${response.status}`);
      sent.set(true);
    } catch {
      error.set('No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.');
    } finally {
      sending.set(false);
    }
  }

  clearFieldValidity(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) input.setCustomValidity('');
  }
}
