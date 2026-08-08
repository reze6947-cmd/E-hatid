import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Seo from '../../components/Seo';
import { blogPosts, BlogPostData } from '../../content/blogPosts';
import { SITE_URL, SITE_NAME } from '../../config/seo';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const history = useHistory();
  const post: BlogPostData | undefined = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-4 text-center">
        <h1 className="text-xl font-bold text-[var(--ion-text-color)]">Post not found</h1>
        <p className="text-sm text-[var(--ion-text-color-secondary)]">
          The article you are looking for may have been moved or removed.
        </p>
        <button
          onClick={() => history.push('/blog')}
          className="text-sm font-semibold text-[var(--ion-color-primary)] underline underline-offset-4"
        >
          Back to the blog
        </button>
      </div>
    );
  }

  const publishedISO = new Date(post.publishedAt).toISOString();

  return (
    <>
      <Seo
        title={`${post.title} | ${SITE_NAME} Blog`}
        description={post.description}
        keywords={post.keywords}
        canonicalPath={`/blog/${post.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: publishedISO,
          dateModified: new Date(post.updatedAt).toISOString(),
          author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        }}
      />

      <article className="max-w-3xl mx-auto pb-8">
        <button
          onClick={() => history.push('/blog')}
          className="text-sm font-semibold text-[var(--ion-color-primary)] underline underline-offset-4 mb-6"
        >
          &larr; Back to the blog
        </button>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ion-text-color)] m-0 leading-tight">
            {post.title}
          </h1>
          <p className="text-sm text-[var(--ion-text-color-secondary)] mt-2">
            Published {new Date(post.publishedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
            {' '}&middot; {post.readMinutes} min read
          </p>
        </header>

        <p className="text-base sm:text-lg text-[var(--ion-text-color-secondary)] mb-6 leading-relaxed">
          {post.description}
        </p>

        <div className="space-y-6">
          {post.sections.map(section => (
            <section key={section.heading}>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--ion-text-color)] m-0 mb-2">
                {section.heading}
              </h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i} className="m-0 mb-2 text-sm sm:text-base text-[var(--ion-text-color-secondary)] leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="m-0 mt-2 space-y-1.5 list-disc pl-5 text-sm sm:text-base text-[var(--ion-text-color-secondary)] leading-relaxed">
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </>
  );
};

export default BlogPost;
