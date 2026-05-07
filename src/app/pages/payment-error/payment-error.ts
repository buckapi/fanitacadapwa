import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-error',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-error.html',
  styleUrl: './payment-error.css',
})
export class PaymentError implements OnInit {
  reason = '';
  responseCode = '';
  buyOrder = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.reason = this.route.snapshot.queryParamMap.get('reason') || '';
    this.responseCode = this.route.snapshot.queryParamMap.get('response_code') || '';
    this.buyOrder = this.route.snapshot.queryParamMap.get('buy_order') || '';
  }
}