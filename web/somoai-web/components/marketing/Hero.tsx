'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-background">
      <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm shadow-sm dark:bg-gray-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span className="text-muted-foreground">Now available in Kenya 🇰🇪</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Personal{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Learning
            </span>{' '}
            Companion
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            SomoAI helps Kenyan students in grades 1-8 learn through personalized AI tutoring.
            Access lessons via SMS, voice calls, or our mobile app.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href={ROUTES.register}>
                Start Learning Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#features">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8">
            <div>
              <p className="text-3xl font-bold text-foreground sm:text-4xl">10K+</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground sm:text-4xl">4.8/5</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground sm:text-4xl">98%</p>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-purple-500 opacity-10 blur-3xl"></div>
      </div>
    </section>
  );
}
