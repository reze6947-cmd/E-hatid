import React from 'react';
import { useHistory } from 'react-router-dom';
import { chevronForwardOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import Seo from '../../components/Seo';
import { blogPosts } from '../../content/blogPosts';
import { SITE_NAME } from '../../config/seo';

const BlogIndex: React.FC = () => {
  const history = useHistory();

  return (
    <>
      <Seo
        title="E-Hatid Blog — Food Delivery, Vendors & Riders"
        description="Guides on food delivery in the Philippines, starting a food stall online, and becoming a delivery rider — from the E-Hatid team."
        keywords="food delivery blog, how to start a food stall, become a delivery rider, food delivery Philippines"
        canonicalPath="/blog"
      />

      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ion-text-color)] m-0">
            E-Hatid Blog
          </h1>
          <p className="text-sm sm:text-base text-[var(--ion-text-color-secondary)] mt-2">
            Food delivery tips, vendor guides, and rider how-tos from the {SITE_NAME} team.
          </p>
        </header>

        <div className="space-y-4">
          {blogPosts.map(post => (
            <article
              key={post.slug}
              onClick={() => history.push(`/blog/${post.slug}`)}
              className="rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h2 className="m-0 text-base sm:text-lg font-bold text-[var(--ion-text-color)]">
                {post.title}
              </h2>
              <p className="m-0 mt-1.5 text-sm text-[var(--ion-text-color-secondary)] leading-relaxed">
                {post.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[var(--ion-text-color-secondary)]">
                  {post.readMinutes} min read
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ion-color-primary)]">
                  Read more
                  <IonIcon icon={chevronForwardOutline} className="text-sm" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default BlogIndex;
