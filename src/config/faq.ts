export interface FaqEntry {
  question: string;
  answer: string;
}

export const faqs: FaqEntry[] = [
  {
    question: 'How does food delivery work with E-Hatid?',
    answer:
      'Choose a food stall near you, add dishes to your cart, and check out. A rider picks up your order from the stall and you can track the delivery live until it reaches your doorstep.',
  },
  {
    question: 'How do I find food delivery near me?',
    answer:
      'Allow location access or enter your address, then browse the food stalls near you. Each stall shows its delivery fee, estimated delivery time, and minimum order so you can compare options before ordering.',
  },
  {
    question: 'Can I open my own food stall on E-Hatid?',
    answer:
      'Yes. Apply as a vendor, upload your menu with photos and prices, and start accepting orders from hungry customers in your area. Set your own delivery fee and minimum order.',
  },
  {
    question: 'Can I earn as a delivery rider with E-Hatid?',
    answer:
      'Yes. Apply as a rider, complete approval, and accept delivery jobs in your area. Earn per delivery while bringing orders to customers\u2019 doorsteps.',
  },
  {
    question: 'How much does food delivery cost?',
    answer:
      'Delivery fees depend on the stall and how far the order travels. The fee and the estimated delivery time are shown before you check out, so there are no surprises.',
  },
];
