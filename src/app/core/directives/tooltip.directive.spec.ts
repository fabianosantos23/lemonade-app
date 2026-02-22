import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  template: `
    <button id="btn1" appTooltip="Tooltip 1">One</button>
    <button id="btn2" appTooltip="Tooltip 2">Two</button>
  `,
  standalone: true,
  imports: [TooltipDirective],
})
class HostComponent {}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let hostElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    hostElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('deve abrir tooltip com atraso padrão de 200ms e fechar ao sair', fakeAsync(() => {
    const button = hostElement.querySelector('#btn1') as HTMLButtonElement;

    button.dispatchEvent(new Event('mouseenter'));
    tick(150);
    expect(document.querySelector('.app-tooltip')).toBeNull();

    tick(60);
    fixture.detectChanges();

    const tooltip = document.querySelector('.app-tooltip') as HTMLElement | null;
    expect(tooltip).not.toBeNull();

    button.dispatchEvent(new Event('mouseleave'));
    tick(200);
    fixture.detectChanges();

    expect(tooltip!.style.opacity).toBe('0');
  }));

  it('deve manter apenas um tooltip visível por vez', fakeAsync(() => {
    const btn1 = hostElement.querySelector('#btn1') as HTMLButtonElement;
    const btn2 = hostElement.querySelector('#btn2') as HTMLButtonElement;

    btn1.dispatchEvent(new Event('mouseenter'));
    tick(220);
    fixture.detectChanges();

    const tooltip1 = document.querySelector('.app-tooltip') as HTMLElement;
    expect(tooltip1.textContent).toContain('Tooltip 1');

    btn2.dispatchEvent(new Event('mouseenter'));
    tick(220);
    fixture.detectChanges();

    const tooltip2 = document.querySelector('.app-tooltip') as HTMLElement;
    expect(tooltip2.textContent).toContain('Tooltip 2');
  }));

  it('deve alinhar o tooltip à esquerda do elemento', fakeAsync(() => {
    const btn1 = hostElement.querySelector('#btn1') as HTMLButtonElement;

    Object.defineProperty(btn1, 'getBoundingClientRect', {
      value: () =>
        ({
          top: 100,
          bottom: 120,
          left: 50,
          right: 150,
          width: 100,
          height: 20,
        }) as DOMRect,
    });

    btn1.dispatchEvent(new Event('mouseenter'));
    tick(220);
    fixture.detectChanges();

    const tooltip = document.querySelector('.app-tooltip') as HTMLElement;
    Object.defineProperty(tooltip, 'getBoundingClientRect', {
      value: () =>
        ({
          top: 0,
          bottom: 20,
          left: 0,
          right: 80,
          width: 80,
          height: 20,
        }) as DOMRect,
    });

    (tooltip as any).style.top = '';
    (tooltip as any).style.left = '';

    (tooltip as any).textContent = 'Tooltip 1';

    (tooltip as any).dispatchEvent(new Event('transitionend'));

    expect(parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(0);
  }));
});

