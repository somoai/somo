'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Tutoring',
    description: 'Get instant help from our AI tutor via text, voice, or video. Available 24/7 in English and Kiswahili.',
  },
  {
    icon: '📱',
    title: 'Multi-Channel Access',
    description: 'Learn anywhere - through SMS (USSD coming soon), voice calls, or our mobile app. No smartphone required!',
  },
  {
    icon: '📚',
    title: 'Complete Curriculum',
    description: 'All subjects for grades 1-8: Mathematics, English, Science, Kiswahili, and Social Studies.',
  },
  {
    icon: '🎯',
    title: 'Personalized Learning',
    description: 'Adaptive lessons that match your pace. The AI adjusts difficulty based on your performance.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Parents and teachers can monitor student progress with detailed analytics and reports.',
  },
  {
    icon: '🏆',
    title: 'Gamification',
    description: 'Earn points, unlock achievements, and build streaks to make learning fun and engaging.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Excel
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed for Kenyan students, parents, and teachers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 text-4xl">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
