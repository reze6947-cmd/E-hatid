import React from 'react';
import { useHistory } from 'react-router-dom';
import Seo from '../components/Seo';
import { faqs } from '../config/faq';
import { SITE_NAME } from '../config/seo';

const Help: React.FC = () => {
  const history = useHistory();

  return (
    <>
      <Seo
        title="Help & FAQ — E-Hatid Food Delivery"
        description="Answers to the most common questions about ordering food delivery, opening a food stall, and becoming a delivery rider with E-Hatid."
        keywords="E-Hatid help, food delivery FAQ, how does food delivery work, contact support"
        canonicalPath="/help"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />

      <div className="max-w-2xl mx-auto pb-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ion-text-color)] m-0">
            Help & FAQ
          </h1>
          <p className="text-sm sm:text-base text-[var(--ion-text-color-secondary)] mt-2">
            Quick answers about ordering, selling, and delivering with {SITE_NAME}.
          </p>
        </header>

        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.question}
              className="rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4"
            >
              <summary className="font-semibold text-[var(--ion-text-color)] cursor-pointer">
                {f.question}
              </summary>
              <p className="m-0 mt-2 text-sm text-[var(--ion-text-color-secondary)] leading-relaxed">
                {f.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-5 text-center">
          <h2 className="m-0 text-base sm:text-lg font-bold text-[var(--ion-text-color)]">
            Still need help?
          </h2>
          <p className="m-0 mt-1.5 text-sm text-[var(--ion-text-color-secondary)]">
            Browse stalls, or start selling or delivering with us.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => history.push('/guest/home')}
              className="h-11 px-5 rounded-xl bg-[var(--ion-color-primary)] text-white font-semibold text-sm"
            >
              Browse Food Stalls
            </button>
            <button
              onClick={() => history.push('/register')}
              className="h-11 px-5 rounded-xl border border-[var(--ion-border-color)] text-[var(--ion-text-color)] font-semibold text-sm"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
