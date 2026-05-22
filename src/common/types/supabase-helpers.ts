/**
 * Supabase Query Type Helpers
 * 
 * These helpers provide proper type inference for Supabase queries
 * to avoid TypeScript inferring 'never' types.
 */

import { Database } from '../../types/database.types';

// Table row types
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Helper to get Row type for a table
export type Row<T extends TableName> = Tables[T]['Row'];

// Helper to get Insert type for a table
export type Insert<T extends TableName> = Tables[T]['Insert'];

// Helper to get Update type for a table
export type Update<T extends TableName> = Tables[T]['Update'];

// Specific table types for convenience
export type Profile = Row<'profiles'>;
export type Organization = Row<'organizations'>;
export type OrganizationMember = Row<'organization_members'>;
export type Event = Row<'events'>;
export type EventCollaborator = Row<'event_collaborators'>;
export type EventTicket = Row<'event_tickets'>;
export type EventRegistration = Row<'event_registrations'>;
export type TicketCustomField = Row<'ticket_custom_fields'>;
export type RegistrationFieldAnswer = Row<'registration_field_answers'>;
export type Wallet = Row<'wallets'>;
export type Transaction = Row<'transactions'>;
export type Referral = Row<'referrals'>;
export type ReferralCode = Row<'referral_codes'>;
export type RedeemCode = Row<'redeem_codes'>;
export type WhatsAppMessage = Row<'whatsapp_messages'>;
export type WhatsAppTemplate = Row<'whatsapp_templates'>;
export type SystemSetting = Row<'system_settings'>;
export type EventApprovalHistory = Row<'event_approval_history'>;
