// ----------------------------------------
// Product Management - Premium Subscription
// ----------------------------------------

import * as z from 'zod';

const env = {
  POLAR_PRODUCT_PREMIUM: process.env.POLAR_PRODUCT_PREMIUM ?? 'premium',
} as const;

// Simplified product schema for template
export const polarProductSchema = z.object({
  createdAt: z.string(),
  description: z.string().nullable().optional(),
  isArchived: z.boolean(),
  isRecurring: z.boolean(),
  metadata: z.record(z.string(), z.any()).optional(),
  modifiedAt: z.string().nullable().optional(),
  name: z.string(),
  organizationId: z.string(),
  prices: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      isArchived: z.boolean(),
      modifiedAt: z.string().nullable(),
      priceAmount: z.number().optional(),
      priceCurrency: z.string().optional(),
      productId: z.string(),
      recurringInterval: z.enum(['month', 'year']).nullable().optional(),
      type: z.string().optional(),
    })
  ),
  productId: z.string(),
  recurringInterval: z.enum(['month', 'year']).nullable().optional(),
});

export type PolarProduct = z.infer<typeof polarProductSchema>;

// Single premium product configuration
export const polarProducts: Record<string, PolarProduct> = {
  // Premium Subscription
  [env.POLAR_PRODUCT_PREMIUM]: {
    createdAt: '2024-01-01T00:00:00Z',
    description: 'Premium subscription with monthly credits',
    isArchived: false,
    isRecurring: true,
    metadata: {
      displayName: 'Premium',
      monthlyCredits: 2000, // Amount of credits included per month
    },
    modifiedAt: null,
    name: 'Premium',
    organizationId: 'org_polar',
    prices: [
      {
        id: 'price_premium_monthly',
        createdAt: '2024-01-01T00:00:00Z',
        isArchived: false,
        modifiedAt: null,
        priceAmount: 2000, // $20.00 in cents
        priceCurrency: 'USD',
        productId: env.POLAR_PRODUCT_PREMIUM,
        recurringInterval: 'month',
        type: 'recurring',
      },
    ],
    productId: env.POLAR_PRODUCT_PREMIUM,
    recurringInterval: 'month',
  },
};

// Helper functions
export function getProduct(productId: string): PolarProduct | null {
  return polarProducts[productId] ?? null;
}

// Helper to get monthly credits from product
export function productToCredits(productId: string): number {
  const product = getProduct(productId);
  // Use metadata field or default to price amount
  return (
    (product?.metadata?.monthlyCredits as number) ??
    product?.prices[0]?.priceAmount ??
    0
  );
}

// ----------------------------------------
// Plan Types for UI Components
// ----------------------------------------

export const SubscriptionPlan = {
  Free: 'free',
  Premium: 'premium',
} as const;

export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const productToPlan = (productId?: string) => {
  if (productId === env.POLAR_PRODUCT_PREMIUM) {
    return 'premium' as const;
  }
};

// Build plans for UI
export const PLANS = {
  [SubscriptionPlan.Free]: {
    key: SubscriptionPlan.Free,
    credits: 0,
    description: 'Get started for free',
    name: 'Free',
    price: 0,
  },
  [SubscriptionPlan.Premium]: {
    key: SubscriptionPlan.Premium,
    credits: productToCredits(env.POLAR_PRODUCT_PREMIUM),
    description: 'Premium features with monthly credits',
    name: 'Premium',
    price: 20, // $20/month
    productId: env.POLAR_PRODUCT_PREMIUM,
  },
} as const;

export type PlanDetails = (typeof PLANS)[keyof typeof PLANS];

// Constants
export const FREE_PLAN_CREDITS = 0; // No free credits by default (can be customized)
