export interface BlogSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface BlogPostData {
  slug: string;
  title: string;
  description: string;
  keywords?: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  sections: BlogSection[];
}

export const blogPosts: BlogPostData[] = [
  {
    slug: 'how-much-does-food-delivery-cost-in-the-philippines',
    title: 'How much does food delivery cost in the Philippines?',
    description:
      'A plain-language guide to how delivery fees work on E-Hatid, what affects the price, and how to keep every order affordable.',
    keywords: 'delivery fees Philippines, food delivery cost, how much is food delivery, delivery fee',
    publishedAt: '2026-08-01',
    updatedAt: '2026-08-01',
    readMinutes: 4,
    sections: [
      {
        heading: 'Delivery fees depend on the stall and distance',
        paragraphs: [
          'On E-Hatid, each stall sets its own delivery fee and minimum order. That means a bowl of hot silog from a stall two barangays away can cost a little more to deliver than from the stall beside your office.',
          'Before you check out, the app shows you the exact delivery fee, the estimated delivery time, and the minimum order for that stall. There are no surprise charges at the end of the order.',
        ],
      },
      {
        heading: 'What actually affects the price?',
        paragraphs: ['A few things move the delivery fee up or down:'],
        bullets: [
          'How far the stall is from your delivery address.',
          'The stall\u2019s own fee setting \u2014 some stalls charge a flat rate, others use the distance.',
          'Your minimum order: ordering more than the minimum keeps the trip worth it for the rider.',
          'Traffic and route length at the time of the order.',
        ],
      },
      {
        heading: 'How to keep delivery affordable',
        paragraphs: [
          'Compare stalls near you before ordering \u2014 the app lists delivery fees next to each stall. Ordering from the closest stall is the fastest and cheapest way to get food delivered. You can also watch for stalls that offer lower fees to nearby addresses.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-start-a-food-stall-online',
    title: 'How to start a food stall online (and get customers fast)',
    description:
      'From menu photos to delivery fees \u2014 everything a small food business needs to open an online stall and start taking orders.',
    keywords: 'open a food stall online, start a food business, online food stall, food stall Philippines',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-08',
    readMinutes: 5,
    sections: [
      {
        heading: 'Why sell online?',
        paragraphs: [
          'A physical stall only reaches the people who walk past it. An online stall on E-Hatid reaches every hungry customer in your delivery area, 24/7, without you building a website or an app.',
        ],
      },
      {
        heading: 'Set up your online stall in minutes',
        paragraphs: ['Here\u2019s what to prepare:'],
        bullets: [
          'Your stall name, category, and a short description of what you serve.',
          'Clear photos of your best dishes \u2014 photos sell food.',
          'A delivery fee and minimum order that works for your margins.',
          'Your actual location, so riders know where to pick up.',
        ],
      },
      {
        heading: 'Get customers fast',
        paragraphs: [
          'Start by telling your current customers you now deliver, and add your E-Hatid stall link to your Facebook page. Delivery riders you already know are a great first audience too \u2014 they are the ones bringing orders to doors every day.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-become-a-delivery-rider',
    title: 'How to become a delivery rider: what you need to know',
    description:
      'A quick guide to applying as an E-Hatid rider, what to prepare, and how to start earning per delivery.',
    keywords: 'become a delivery rider, delivery rider jobs, delivery rider Philippines, rider application',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-08',
    readMinutes: 4,
    sections: [
      {
        heading: 'Who can apply?',
        paragraphs: [
          'Anyone with a bike, motorcycle, or car who wants to earn per delivery can apply to be an E-Hatid rider. You apply in the app, wait for approval, and once approved you can start accepting delivery jobs in your area.',
        ],
      },
      {
        heading: 'What to prepare',
        bullets: [
          'A valid government ID for verification.',
          'Your vehicle details: type, license plate, and driver\u2019s license number.',
          'A smartphone with the app and location services turned on.',
          'A bank account so you can receive your earnings.',
        ],
      },
      {
        heading: 'How earnings work',
        paragraphs: [
          'You earn per delivery. Each job shows the pickup stall and the customer\u2019s address before you accept, and the app guides you with navigation. Riders who stay available during busy hours typically take more jobs.',
        ],
      },
    ],
  },
];
