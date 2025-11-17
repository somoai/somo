'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_TIERS, ROUTES } from '@/lib/constants';

const tiers = [
  {
    ...SUBSCRIPTION_TIERS.FREE,
    popular: false,
    cta: 'Start Free',
  },
  {
    ...SUBSCRIPTION_TIERS.BASIC,
    popular: true,
    cta: 'Get Started',
  },
  {
    ...SUBSCRIPTION_TIERS.PREMIUM,
    popular: false,
    cta: 'Go Premium',
  },
];

export function Pricing() {
  return (
    <section className="py-20 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that works best for you. All plans include 7-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.popular
                  ? 'border-primary shadow-lg ring-2 ring-primary'
                  : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.currency} {tier.price}
                  </span>
                  {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <Link href={ROUTES.register}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All prices in Kenyan Shillings. Cancel anytime.{' '}
          <Link href="/support" className="underline hover:text-primary">
            Questions?
          </Link>
        </p>
      </div>
    </section>
  );
}
