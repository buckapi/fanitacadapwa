import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersClient } from './orders-client';

describe('OrdersClient', () => {
  let component: OrdersClient;
  let fixture: ComponentFixture<OrdersClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
