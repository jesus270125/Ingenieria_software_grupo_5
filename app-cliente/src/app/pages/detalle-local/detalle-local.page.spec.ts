import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleLocalPage } from './detalle-local.page';

describe('DetalleLocalPage', () => {
  let component: DetalleLocalPage;
  let fixture: ComponentFixture<DetalleLocalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleLocalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
