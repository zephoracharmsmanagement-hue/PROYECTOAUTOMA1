/**
 * Tipos de la base de datos.
 *
 * Este archivo esta escrito a mano para que el proyecto compile sin depender de
 * una conexion a Supabase. En cuanto tengas el proyecto enlazado, regeneralo con:
 *
 *   npm run db:types
 *
 * (equivale a `supabase gen types typescript --local > src/types/database.types.ts`)
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'customer' | 'admin';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'expired';
export type OrderItemKind = 'main' | 'bump' | 'upsell' | 'path';
export type AutomationPlatform = 'n8n' | 'make' | 'zapier' | 'other';
export type ChunkSource =
  'package_description' | 'lesson_description' | 'lesson_transcript' | 'lesson_resource';
export type AssistantRole = 'user' | 'assistant';
export type OfferPlacement = 'bump' | 'upsell';
export type ReferralStatus = 'pending' | 'approved' | 'paid' | 'void';
export type QuestionStatus = 'open' | 'answered' | 'hidden';
export type EntitlementKind = 'package' | 'all_access';
export type EntitlementSource = 'purchase' | 'subscription' | 'manual_grant';
export type EntitlementStatus = 'active' | 'revoked' | 'expired';
export type BillingInterval = 'month' | 'year';
export type VideoProviderName = 'bunny' | 'mux' | 'youtube' | 'none';

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  stripe_customer_id: string | null;
  referred_by_affiliate_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PackageRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  outcome: string | null;
  category: string;
  level: string;
  cover_url: string | null;
  features: Array<{ title: string; detail: string }>;
  price_one_time_cents: number | null;
  compare_at_price_cents: number | null;
  currency: string;
  stripe_price_id_one_time: string | null;
  included_in_subscription: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ModuleRow = {
  id: string;
  package_id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  created_at: string;
};

export type LessonRow = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string | null;
  provider: VideoProviderName;
  video_asset_id: string | null;
  duration_seconds: number;
  is_preview: boolean;
  transcript: string | null;
  resources: Array<{ label: string; url: string }>;
  sort_order: number;
  created_at: string;
};

/** Vista publica del temario: nunca expone `video_asset_id`. */
export type LessonOutlineRow = {
  id: string;
  module_id: string;
  package_id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  is_preview: boolean;
  sort_order: number;
};

export type PlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  interval: BillingInterval;
  price_cents: number;
  currency: string;
  stripe_price_id: string;
  features: string[];
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  user_id: string;
  package_id: string | null;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  path_id: string | null;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  dunning_attempts: number;
  dunning_last_at: string | null;
  grace_until: string | null;
  created_at: string;
  updated_at: string;
};

export type EntitlementRow = {
  id: string;
  user_id: string;
  kind: EntitlementKind;
  package_id: string | null;
  source: EntitlementSource;
  status: EntitlementStatus;
  order_id: string | null;
  subscription_id: string | null;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
};

export type LessonProgressRow = {
  user_id: string;
  lesson_id: string;
  seconds_watched: number;
  completed_at: string | null;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  package_id: string | null;
  kind: OrderItemKind;
  amount_cents: number;
  created_at: string;
};

export type OfferRow = {
  id: string;
  source_package_id: string;
  offer_package_id: string;
  placement: OfferPlacement;
  headline: string;
  description: string | null;
  stripe_price_id: string | null;
  price_cents: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CampaignRow = {
  id: string;
  name: string;
  headline: string;
  subheadline: string | null;
  code_label: string | null;
  stripe_promotion_code_id: string | null;
  cta_label: string | null;
  cta_href: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Una variante de experimento. `payload` es libre segun el experimento. */
export type ExperimentVariant = {
  id: string;
  label: string;
  weight: number;
  payload: Record<string, string>;
};

export type ExperimentRow = {
  id: string;
  key: string;
  name: string;
  hypothesis: string | null;
  variants: ExperimentVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentChunkRow = {
  id: string;
  package_id: string;
  lesson_id: string | null;
  source: ChunkSource;
  heading: string;
  content: string;
  position: number;
  created_at: string;
};

export type AssistantConversationRow = {
  id: string;
  user_id: string;
  package_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AssistantMessageRow = {
  id: string;
  conversation_id: string;
  role: AssistantRole;
  content: string;
  citations: Array<{ heading: string; lessonSlug?: string | null }>;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
};

export type PathRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  outcome: string | null;
  cover_url: string | null;
  price_one_time_cents: number | null;
  currency: string;
  stripe_price_id_one_time: string | null;
  included_in_subscription: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PathPackageRow = {
  path_id: string;
  package_id: string;
  note: string | null;
  sort_order: number;
};

export type AutomationRow = {
  id: string;
  package_id: string;
  lesson_id: string | null;
  name: string;
  description: string | null;
  platform: AutomationPlatform;
  version: string;
  workflow: Json;
  setup_notes: string | null;
  requires: string[];
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AffiliateRow = {
  id: string;
  user_id: string;
  code: string;
  commission_pct: number;
  is_active: boolean;
  payout_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ReferralRow = {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  order_id: string | null;
  subscription_id: string | null;
  stripe_reference: string;
  amount_cents: number;
  commission_cents: number;
  currency: string;
  status: ReferralStatus;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInvoiceRow = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  billing_reason: string | null;
  paid_at: string;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  package_id: string;
  lesson_id: string | null;
  user_id: string;
  title: string;
  body: string;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
};

export type AnswerRow = {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
};

export type CertificateRow = {
  id: string;
  user_id: string;
  package_id: string;
  code: string;
  issued_at: string;
};

export type TestimonialRow = {
  id: string;
  package_id: string | null;
  author_name: string;
  author_role: string | null;
  author_avatar_url: string | null;
  quote: string;
  result: string | null;
  rating: number | null;
  source_url: string | null;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WebhookEventRow = {
  id: string;
  stripe_event_id: string;
  type: string;
  payload: Json | null;
  processed_at: string;
};

export type LeadRow = {
  id: string;
  email: string;
  source: string;
  metadata: Json;
  created_at: string;
};

/** Forma de una relacion de clave foranea, tal como la genera Supabase. */
type Relationship<Columns extends string[], Referenced extends string> = {
  foreignKeyName: string;
  columns: Columns;
  isOneToOne: boolean;
  referencedRelation: Referenced;
  referencedColumns: string[];
};

type Table<
  Row,
  Relationships extends readonly unknown[] = [],
  Insert = Partial<Row>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      packages: Table<PackageRow>;
      modules: Table<ModuleRow, [Relationship<['package_id'], 'packages'>]>;
      lessons: Table<LessonRow, [Relationship<['module_id'], 'modules'>]>;
      plans: Table<PlanRow>;
      orders: Table<
        OrderRow,
        [Relationship<['package_id'], 'packages'>, Relationship<['user_id'], 'profiles'>]
      >;
      subscriptions: Table<
        SubscriptionRow,
        [Relationship<['plan_id'], 'plans'>, Relationship<['user_id'], 'profiles'>]
      >;
      entitlements: Table<
        EntitlementRow,
        [
          Relationship<['user_id'], 'profiles'>,
          Relationship<['package_id'], 'packages'>,
          Relationship<['order_id'], 'orders'>,
          Relationship<['subscription_id'], 'subscriptions'>,
        ]
      >;
      lesson_progress: Table<LessonProgressRow>;
      testimonials: Table<TestimonialRow, [Relationship<['package_id'], 'packages'>]>;
      order_items: Table<
        OrderItemRow,
        [Relationship<['order_id'], 'orders'>, Relationship<['package_id'], 'packages'>]
      >;
      offers: Table<
        OfferRow,
        [
          Relationship<['source_package_id'], 'packages'>,
          Relationship<['offer_package_id'], 'packages'>,
        ]
      >;
      campaigns: Table<CampaignRow>;
      paths: Table<PathRow>;
      content_chunks: Table<
        ContentChunkRow,
        [Relationship<['package_id'], 'packages'>, Relationship<['lesson_id'], 'lessons'>]
      >;
      assistant_conversations: Table<
        AssistantConversationRow,
        [Relationship<['user_id'], 'profiles'>, Relationship<['package_id'], 'packages'>]
      >;
      assistant_messages: Table<
        AssistantMessageRow,
        [Relationship<['conversation_id'], 'assistant_conversations'>]
      >;
      path_packages: Table<
        PathPackageRow,
        [Relationship<['path_id'], 'paths'>, Relationship<['package_id'], 'packages'>]
      >;
      automations: Table<
        AutomationRow,
        [Relationship<['package_id'], 'packages'>, Relationship<['lesson_id'], 'lessons'>]
      >;
      affiliates: Table<AffiliateRow, [Relationship<['user_id'], 'profiles'>]>;
      referrals: Table<
        ReferralRow,
        [
          Relationship<['affiliate_id'], 'affiliates'>,
          Relationship<['referred_user_id'], 'profiles'>,
          Relationship<['order_id'], 'orders'>,
        ]
      >;
      subscription_invoices: Table<
        SubscriptionInvoiceRow,
        [Relationship<['user_id'], 'profiles'>, Relationship<['subscription_id'], 'subscriptions'>]
      >;
      questions: Table<
        QuestionRow,
        [
          Relationship<['package_id'], 'packages'>,
          Relationship<['lesson_id'], 'lessons'>,
          Relationship<['user_id'], 'profiles'>,
        ]
      >;
      answers: Table<
        AnswerRow,
        [Relationship<['question_id'], 'questions'>, Relationship<['user_id'], 'profiles'>]
      >;
      experiments: Table<ExperimentRow>;
      certificates: Table<
        CertificateRow,
        [Relationship<['user_id'], 'profiles'>, Relationship<['package_id'], 'packages'>]
      >;
      webhook_events: Table<WebhookEventRow>;
      leads: Table<LeadRow>;
    };
    Views: {
      lesson_outline: { Row: LessonOutlineRow; Relationships: [] };
    };
    Functions: {
      has_all_access: { Args: { p_user_id: string }; Returns: boolean };
      has_package_access: { Args: { p_user_id: string; p_package_id: string }; Returns: boolean };
      is_admin: { Args: { p_user_id: string }; Returns: boolean };
      admin_dashboard_metrics: { Args: Record<string, never>; Returns: Json };
      verify_certificate: { Args: { p_code: string }; Returns: Json };
      admin_business_metrics: { Args: { p_months?: number }; Returns: Json };
      package_thread: {
        Args: { p_package_id: string; p_lesson_id?: string | null };
        Returns: Json;
      };
      display_name: { Args: { p_full_name: string; p_email: string }; Returns: string };
      automation_catalog: { Args: { p_package_id: string }; Returns: Json };
      search_content_chunks: {
        Args: { p_query: string; p_package_id?: string | null; p_limit?: number };
        Returns: Array<{
          id: string;
          package_id: string;
          lesson_id: string | null;
          heading: string;
          content: string;
          score: number;
        }>;
      };
      assistant_messages_today: { Args: Record<string, never>; Returns: number };
      reindex_package_content: { Args: { p_package_id: string }; Returns: number };
      issue_certificate_if_complete: { Args: { p_package_id: string }; Returns: string | null };
    };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      order_status: OrderStatus;
      entitlement_kind: EntitlementKind;
      entitlement_source: EntitlementSource;
      entitlement_status: EntitlementStatus;
      billing_interval: BillingInterval;
      video_provider: VideoProviderName;
      order_item_kind: OrderItemKind;
      offer_placement: OfferPlacement;
      referral_status: ReferralStatus;
      question_status: QuestionStatus;
      automation_platform: AutomationPlatform;
      chunk_source: ChunkSource;
      assistant_role: AssistantRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
