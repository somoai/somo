export const SITE_CONFIG = {
  name: 'SomoAI',
  description: 'AI-powered education platform for Kenyan students',
  tagline: 'Your personal AI learning companion',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/SomoAI_Kenya',
    github: 'https://github.com/somoai',
    support: 'mailto:support@somoai.co.ke',
  },
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const COLORS = {
  primary: '#3b82f6', // Blue
  secondary: '#8b5cf6', // Purple
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  info: '#06b6d4', // Cyan
};

export const SUBJECTS = [
  { id: 'MATH', name: 'Mathematics', emoji: '📐', color: '#3b82f6' },
  { id: 'ENG', name: 'English', emoji: '📚', color: '#8b5cf6' },
  { id: 'SCI', name: 'Science', emoji: '🔬', color: '#10b981' },
  { id: 'KISW', name: 'Kiswahili', emoji: '🇰🇪', color: '#f59e0b' },
  { id: 'SST', name: 'Social Studies', emoji: '🌍', color: '#06b6d4' },
];

export const GRADE_LEVELS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Grade ${i + 1}`,
}));

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'KES',
    features: [
      '5 lessons per day',
      'Basic AI tutoring',
      'SMS access',
      'Progress tracking',
    ],
  },
  BASIC: {
    name: 'Basic',
    price: 99,
    currency: 'KES',
    features: [
      'Unlimited lessons',
      'AI text tutoring',
      'Voice tutoring (30 min/day)',
      'All subjects',
      'Progress reports',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 299,
    currency: 'KES',
    features: [
      'Everything in Basic',
      'AI video tutoring (60 min/day)',
      'Priority support',
      'Advanced analytics',
      'Parent dashboard',
      'Download reports',
    ],
  },
};

export const ROUTES = {
  home: '/',
  features: '/features',
  pricing: '/pricing',
  about: '/about',
  login: '/login',
  register: '/register',
  parent: {
    dashboard: '/parent',
    children: '/parent/children',
    settings: '/parent/settings',
  },
  teacher: {
    dashboard: '/teacher',
    students: '/teacher/students',
    classes: '/teacher/classes',
    settings: '/teacher/settings',
  },
};
