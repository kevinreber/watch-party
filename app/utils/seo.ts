/**
 * SEO Utilities for Watch Party
 * Provides helper functions for generating meta tags, Open Graph tags, and structured data
 */

export const SEO_CONFIG = {
  siteName: 'Watch Party',
  siteUrl: 'https://watchparty.app',
  defaultTitle: 'Watch Party - Watch Videos Together with Friends',
  defaultDescription:
    'Create synchronized watch parties to enjoy YouTube videos with friends in real-time. Features live chat, emoji reactions, polls, and more.',
  defaultImage: '/og-image.png',
  twitterHandle: '@watchpartyapp',
  themeColor: '#6366f1',
  locale: 'en_US',
};

export interface MetaTagsOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'video.other';
  noIndex?: boolean;
}

/**
 * Generates meta tags array for React Router's meta function
 */
export const generateMetaTags = (options: MetaTagsOptions = {}) => {
  const {
    title = SEO_CONFIG.defaultTitle,
    description = SEO_CONFIG.defaultDescription,
    image = SEO_CONFIG.defaultImage,
    url = SEO_CONFIG.siteUrl,
    type = 'website',
    noIndex = false,
  } = options;

  const fullTitle = title.includes(SEO_CONFIG.siteName) ? title : `${title} | ${SEO_CONFIG.siteName}`;
  const fullImageUrl = image.startsWith('http') ? image : `${SEO_CONFIG.siteUrl}${image}`;

  const tags = [
    // Basic meta tags
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'theme-color', content: SEO_CONFIG.themeColor },

    // Open Graph tags
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:image', content: fullImageUrl },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SEO_CONFIG.siteName },
    { property: 'og:locale', content: SEO_CONFIG.locale },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: SEO_CONFIG.twitterHandle },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: fullImageUrl },
  ];

  // Add noindex if specified
  if (noIndex) {
    tags.push({ name: 'robots', content: 'noindex, nofollow' });
  }

  return tags;
};

/**
 * Generates meta tags for a room page
 */
export const generateRoomMetaTags = (roomName: string, videoTitle?: string, videoThumbnail?: string) => {
  const title = videoTitle ? `Watching "${videoTitle}" in ${roomName}` : `${roomName} - Watch Party Room`;

  const description = videoTitle
    ? `Join the watch party! Currently watching "${videoTitle}" in room "${roomName}". Watch together with synchronized playback and live chat.`
    : `Join the "${roomName}" watch party room. Watch YouTube videos together with friends in real-time sync.`;

  return generateMetaTags({
    title,
    description,
    image: videoThumbnail || SEO_CONFIG.defaultImage,
    type: 'video.other',
  });
};

/**
 * Generates meta tags for a user profile page
 */
export const generateProfileMetaTags = (username: string, stats?: { watchTime?: number; partiesHosted?: number }) => {
  let description = `Check out ${username}'s Watch Party profile.`;

  if (stats) {
    const parts = [];
    if (stats.watchTime) {
      const hours = Math.floor(stats.watchTime / 60);
      parts.push(`${hours}+ hours watched`);
    }
    if (stats.partiesHosted) {
      parts.push(`${stats.partiesHosted} parties hosted`);
    }
    if (parts.length > 0) {
      description += ` ${parts.join(', ')}.`;
    }
  }

  return generateMetaTags({
    title: `${username}'s Profile`,
    description,
    type: 'profile',
  });
};

/**
 * Generates meta tags for the leaderboards page
 */
export const generateLeaderboardMetaTags = () => {
  return generateMetaTags({
    title: 'Leaderboards - Top Watch Party Users',
    description:
      'See who tops the Watch Party leaderboards! Rankings for watch time, parties hosted, messages sent, and more. Compete with friends and climb the ranks.',
  });
};

/**
 * Generates meta tags for the events page
 */
export const generateEventsMetaTags = () => {
  return generateMetaTags({
    title: 'Events - Community Watch Parties',
    description:
      'Join community events on Watch Party! Participate in marathons, challenges, and special events to earn bonus XP, exclusive badges, and rewards.',
  });
};

/**
 * Generates meta tags for the admin dashboard
 */
export const generateAdminMetaTags = () => {
  return generateMetaTags({
    title: 'Admin Dashboard',
    description: 'Watch Party admin dashboard for managing users, rooms, and viewing analytics.',
    noIndex: true, // Admin pages should not be indexed
  });
};

/**
 * Generates JSON-LD structured data for the website
 */
export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.defaultDescription,
    applicationCategory: 'Entertainment',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: ['Synchronized video playback', 'Real-time chat', 'Emoji reactions', 'Polls', 'Watch streaks'],
  };
};

/**
 * Generates JSON-LD structured data for a video watching session
 */
export const generateVideoSchema = (video: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  embedUrl?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description || `Watching "${video.name}" on Watch Party`,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    embedUrl: video.embedUrl,
    uploadDate: new Date().toISOString(),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WatchAction',
      userInteractionCount: 1,
    },
  };
};

/**
 * Generates JSON-LD structured data for a user profile
 */
export const generatePersonSchema = (user: { username: string; avatar?: string; createdAt?: string }) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.username,
    image: user.avatar,
    memberOf: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
    },
  };
};

/**
 * Generates JSON-LD structured data for an event
 */
export const generateEventSchema = (event: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  participantCount?: number;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url: SEO_CONFIG.siteUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
    ...(event.participantCount && {
      maximumAttendeeCapacity: event.participantCount,
    }),
  };
};

/**
 * Generates JSON-LD breadcrumb schema
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};
