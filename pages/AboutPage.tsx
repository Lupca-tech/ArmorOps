
import React, { useState, useEffect } from 'react';
import { Translation, Language } from '../translations';

interface AboutPageProps {
  T: Translation;
  lang: Language;
}

const PainPointCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center transition-all transform hover:scale-105 hover:border-red-500/50">
    <h3 className="text-xl font-semibold text-red-400 mb-2">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </div>
);

const DataVizCard: React.FC<{ icon: React.ReactNode, title: string, value: string, children: React.ReactNode }> = ({ icon, title, value, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 transition-all transform hover:-translate-y-1">
    <div className="flex items-center gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
        {icon}
        </div>
        <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">{value}</p>
        </div>
    </div>
    <p className="text-gray-400 mt-4">{children}</p>
  </div>
);

// --- New Component for Blog Posts ---
interface Post {
  title: string;
  link: string;
  summary: string;
  publishedDate: string;
}

const LatestBlogPosts: React.FC<{ T: Translation, lang: Language }> = ({ T, lang }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Use a CORS-friendly RSS-to-JSON service to avoid "Failed to fetch" errors.
        const rssUrl = 'https://www.devsecopsstory.com/feeds/posts/default';
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error('Failed to parse RSS feed via proxy.');
        }

        const fetchedPosts: Post[] = data.items.slice(0, 3).map((item: any) => {
          // The description from rss2json is HTML, so we clean it for a plain text summary.
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = item.description;
          const summary = (tempDiv.textContent || tempDiv.innerText || "").substring(0, 120) + '...';

          return {
            title: item.title,
            link: item.link,
            summary: summary,
            publishedDate: item.pubDate,
          };
        });
        
        setPosts(fetchedPosts);

      } catch (e) {
        console.error("Failed to fetch blog posts:", e);
        setError(T.blogCtaError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [T.blogCtaError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const SkeletonCard = () => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-6"></div>
      <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-5/6"></div>
    </div>
  );

  return (
    <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">{T.blogCtaTitle}</h2>
                <p className="text-gray-400 mb-12">{T.blogCtaDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : error ? (
                    <div className="col-span-full text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-6 rounded-md">
                        <p>{error}</p>
                         <a href="https://www.devsecopsstory.com/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
                            Visit Blog
                        </a>
                    </div>
                ) : (
                    posts.map((post, index) => (
                        <a 
                            key={index} 
                            href={post.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block bg-gray-800/50 p-6 rounded-lg border border-gray-700 transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-2 hover:shadow-lg hover:shadow-cyan-900/50 group"
                        >
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                            <p className="text-xs text-gray-500 mb-4">{T.publishedOn} {formatDate(post.publishedDate)}</p>
                            <p className="text-sm text-gray-400 flex-grow">{post.summary}</p>
                        </a>
                    ))
                )}
            </div>

            <div className="text-center mt-16">
                 <a 
                    href="https://www.devsecopsstory.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => {
                      if (typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', 'click_outbound', {
                          'event_category': 'outbound',
                          'event_label': 'about_page_blog_cta',
                        });
                      }
                    }}
                    className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 text-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 animate-pulse-shadow"
                 >
                    {T.blogCtaButton}
                </a>
            </div>
        </div>
    </section>
  );
}

const CommunitySection: React.FC<{ T: Translation }> = ({ T }) => {
    const communityPlatforms = [
        {
            name: T.communityYouTubeTitle,
            description: T.communityYouTubeDesc,
            cta: T.communityYouTubeCTA,
            imgSrc: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4sE2QkinhrcJDL6IRD05Q_9PnCrgVxXEdDqlW8Osu5T1ZFho7cqRYL6H6i7ln4Xln-xVqyoXqIhC40jnkwOO-E7nfquYAGlofHAgiUQwBBasIYvPSFEawX1QC_cFeehTglBQuafS0x5A0ykINXv6UDvuMLo3g5jUOdefcqupublj7EoIauFB5f7ymhs4/s1600/Screenshot%202025-11-11%20144108.png",
            link: "https://youtube.com/@devsecopsstory",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.188-.009 1.043-.074 1.957l-.008.104-.022.26-.01.104c-.048.519-.119 1.023-.22 1.402a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.8 99.8 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408z"/></svg>
        },
        {
            name: T.communityTikTokTitle,
            description: T.communityTikTokDesc,
            cta: T.communityTikTokCTA,
            imgSrc: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhz_38SPItnukzxQpeSriX3pMZBOrSz2X9WGtOqqm2QS-akfDG4KH_u7vxOlJiMjTUVuJkElAfsRTddem6M_9LolK-Qbkwh6qUE9JfNmM37M8yRETLhhhMJbnsJUxlZ9zjFsnVVkg8hj67vGKF7Meh22V-uNYed1x8Ucwr0LeyONg_-F72YvBt8EvhZQ_4/s1600/Screenshot%202025-11-11%20144337.png",
            link: "https://www.tiktok.com/@devsecopsstory",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/></svg>
        },
        {
            name: T.communityFacebookTitle,
            description: T.communityFacebookDesc,
            cta: T.communityFacebookCTA,
            imgSrc: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjtma3Coe81DOyEBZ2n67Brb4O83igdHgOdx2-feoCXVxQ1ouiQQXWi8HL56mbBQpdMq9Ih1XVb2rmuNTI2FFrxW9EGlpCQ92D7_Qi4WC8bb581S8EkaDggkB4wEr5NJfhGhYYcWUvhW3ZXZknnex7eb2BgLctlfPSMJZnFIhqXh79kNUKrMab7F3Om6oY/s320/Blue%20Purple%20Orange%20Cartoon%20Playful%20Web%20Software%20Development%20Announcement%20Ba_20251015_205700_0000.jpg",
            link: "https://m.facebook.com/@devsecopsstory",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
        }
    ];

    return (
        <section className="py-20 px-4 bg-gray-950/50">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">{T.communitySectionTitle}</h2>
                    <p className="text-gray-400 mb-12">{T.communitySectionSubtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {communityPlatforms.map((platform, index) => (
                        <a
                            key={index}
                            href={platform.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (typeof (window as any).gtag === 'function') {
                                (window as any).gtag('event', 'click_outbound', {
                                  'event_category': 'outbound',
                                  'event_label': `about_page_community_${platform.name.toLowerCase().replace(/ /g, '_')}`,
                                });
                              }
                            }}
                            className="group relative block overflow-hidden rounded-xl border border-gray-800 transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/50"
                        >
                            <img
                                src={platform.imgSrc}
                                alt={`${platform.name} preview`}
                                className="w-full h-80 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                                <div className="flex items-center gap-3 mb-2">
                                    {platform.icon}
                                    <h3 className="text-xl font-bold">{platform.name}</h3>
                                </div>
                                <p className="text-sm text-gray-300 mb-4">{platform.description}</p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 group-hover:bg-cyan-500 transition-colors">
                                    {platform.cta}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};


const AboutPage: React.FC<AboutPageProps> = ({ T, lang }) => {
  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gray-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-cyan-500/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_50%)]"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-md mx-auto mb-8">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-32 w-32">
              <defs>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path fill="url(#shieldGradient)" fillOpacity="0.1" d="M49.8,-57.4C63.6,-45,73.4,-27.1,76.1,-8.3C78.8,10.5,74.4,30.3,62.8,44.9C51.2,59.5,32.4,69,14.1,72.4C-4.3,75.8,-22.2,73.2,-38.7,64.8C-55.2,56.4,-70.2,42.2,-77.2,25.4C-84.1,8.6,-82.9,-10.8,-74.6,-26.3C-66.3,-41.8,-50.9,-53.4,-35.3,-60.7C-19.6,-68.1,-3.8,-71.2,11.5,-68.1C26.8,-65.1,49.8,-57.4,49.8,-57.4Z" transform="translate(100 100)" />
              <path d="M100 25 L35 55 L35 125 L100 155 L165 125 L165 55 Z" stroke="url(#shieldGradient)" strokeWidth="4" fill="none" />
              <polyline points="100,55 100,125" stroke="url(#shieldGradient)" strokeWidth="2" />
              <polyline points="67,75 100,55 133,75" stroke="url(#shieldGradient)" strokeWidth="2" />
              <polyline points="67,105 100,125 133,105" stroke="url(#shieldGradient)" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 [text-wrap:balance]">
            {T.aboutHeroTitle}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto [text-wrap:balance]">
            {T.aboutHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">{T.aboutValuesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PainPointCard title={T.value1Title}>{T.value1Desc}</PainPointCard>
            <PainPointCard title={T.value2Title}>{T.value2Desc}</PainPointCard>
            <PainPointCard title={T.value3Title}>{T.value3Desc}</PainPointCard>
          </div>
          
          <div className="my-12 flex justify-center">
             <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400 rotate-90 md:rotate-0">
                <path d="M12 4L12 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 14L12 20L6 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="max-w-3xl mx-auto bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-cyan-500/50 shadow-lg">
             <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="h-16 w-16 text-cyan-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.93,12.08 C15.75,12.26 15.5,12.35 15.25,12.35 C15,12.35 14.75,12.26 14.57,12.08 L12,9.5 L9.43,12.08 C9.08,12.42 8.5,12.42 8.15,12.08 C7.8,11.73 7.8,11.15 8.15,10.8 L11.4,7.55 C11.75,7.2 12.33,7.2 12.68,7.55 L15.93,10.8 C16.28,11.15 16.28,11.73 15.93,12.08 Z" fill="currentColor"/>
                        <path d="M21,12 C21,16.97 16.97,21 12,21 C7.03,21 3,16.97 3,12 C3,7.03 7.03,3 12,3 C16.97,3 21,7.03 21,12 Z M5,12 C5,15.87 8.13,19 12,19 C15.87,19 19,15.87 19,12 C19,8.13 15.87,5 12,5 C8.13,5 5,8.13 5,12 Z" fill="currentColor"/>
                    </svg>
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-white mb-2">{T.solutionTitle}</h3>
                    <p className="text-gray-300">{T.solutionDesc}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Data Visualization Section */}
      <section className="py-20 px-4">
         <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">{T.dataVizTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <DataVizCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title={T.viz1Title}
              value="99.99%"
            >
              {T.viz1Desc}
            </DataVizCard>
            <DataVizCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
              title={T.viz2Title}
              value=">80%"
            >
              {T.viz2Desc}
            </DataVizCard>
          </div>
        </div>
      </section>
      
      {/* Latest Blog Posts Section */}
      <LatestBlogPosts T={T} lang={lang} />
      
      {/* Community Section */}
      <CommunitySection T={T} />
    </div>
  );
};

export default AboutPage;
