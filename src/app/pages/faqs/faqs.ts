import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faqs.html',
  styleUrl: './faqs.css',
})
export class Faqs {
 activeIndex: number | null = 0;

  toggleAccordion(index: number): void {
    console.log('click faq', index);
    this.activeIndex = this.activeIndex === index ? null : index;
  }
}
