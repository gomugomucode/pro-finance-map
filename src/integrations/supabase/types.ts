export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          color: string | null
          created_at: string
          credit_limit_minor: number | null
          currency: string
          current_balance_minor: number
          icon: string | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          is_frozen: boolean
          is_hidden: boolean
          name: string
          notes: string | null
          opening_balance_minor: number
          sort_order: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          credit_limit_minor?: number | null
          currency?: string
          current_balance_minor?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_frozen?: boolean
          is_hidden?: boolean
          name: string
          notes?: string | null
          opening_balance_minor?: number
          sort_order?: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          credit_limit_minor?: number | null
          currency?: string
          current_balance_minor?: number
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_frozen?: boolean
          is_hidden?: boolean
          name?: string
          notes?: string | null
          opening_balance_minor?: number
          sort_order?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          id: string
          mime: string | null
          size_bytes: number | null
          storage_path: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime?: string | null
          size_bytes?: number | null
          storage_path: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime?: string | null
          size_bytes?: number | null
          storage_path?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          asset_id: string | null
          loan_id: string | null
          merchant_id: string | null
          document_type: string
          filename: string
          mime_type: string
          file_size: number
          storage_path: string
          thumbnail_path: string | null
          tags: string[] | null
          notes: string | null
          is_favorite: boolean
          is_archived: boolean
          ocr_status: string
          ocr_confidence: number | null
          extracted_merchant: string | null
          extracted_date: string | null
          extracted_total: number | null
          extracted_tax: number | null
          extracted_category: string | null
          extracted_raw_text: string | null
          ocr_provider: string | null
          ocr_processed_at: string | null
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id?: string | null
          asset_id?: string | null
          loan_id?: string | null
          merchant_id?: string | null
          document_type?: string
          filename: string
          mime_type: string
          file_size?: number
          storage_path: string
          thumbnail_path?: string | null
          tags?: string[] | null
          notes?: string | null
          is_favorite?: boolean
          is_archived?: boolean
          ocr_status?: string
          ocr_confidence?: number | null
          extracted_merchant?: string | null
          extracted_date?: string | null
          extracted_total?: number | null
          extracted_tax?: number | null
          extracted_category?: string | null
          extracted_raw_text?: string | null
          ocr_provider?: string | null
          ocr_processed_at?: string | null
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string | null
          asset_id?: string | null
          loan_id?: string | null
          merchant_id?: string | null
          document_type?: string
          filename?: string
          mime_type?: string
          file_size?: number
          storage_path?: string
          thumbnail_path?: string | null
          tags?: string[] | null
          notes?: string | null
          is_favorite?: boolean
          is_archived?: boolean
          ocr_status?: string
          ocr_confidence?: number | null
          extracted_merchant?: string | null
          extracted_date?: string | null
          extracted_total?: number | null
          extracted_tax?: number | null
          extracted_category?: string | null
          extracted_raw_text?: string | null
          ocr_provider?: string | null
          ocr_processed_at?: string | null
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_imported_transactions: {
        Row: {
          id: string
          user_id: string
          source: string
          sender: string
          raw_message: string
          extracted_amount_minor: number
          extracted_merchant: string | null
          extracted_ref: string | null
          extracted_type: string
          extracted_balance_minor: number | null
          extracted_date: string
          confidence_score: number
          status: string
          matched_account_id: string | null
          matched_category_id: string | null
          matched_merchant_id: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          source?: string
          sender: string
          raw_message: string
          extracted_amount_minor?: number
          extracted_merchant?: string | null
          extracted_ref?: string | null
          extracted_type?: string
          extracted_balance_minor?: number | null
          extracted_date?: string
          confidence_score?: number
          status?: string
          matched_account_id?: string | null
          matched_category_id?: string | null
          matched_merchant_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          sender?: string
          raw_message?: string
          extracted_amount_minor?: number
          extracted_merchant?: string | null
          extracted_ref?: string | null
          extracted_type?: string
          extracted_balance_minor?: number | null
          extracted_date?: string
          confidence_score?: number
          status?: string
          matched_account_id?: string | null
          matched_category_id?: string | null
          matched_merchant_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_imported_transactions_matched_account_id_fkey"
            columns: ["matched_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_imported_transactions_matched_category_id_fkey"
            columns: ["matched_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_imported_transactions_matched_merchant_id_fkey"
            columns: ["matched_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_provider_rules: {
        Row: {
          id: string
          user_id: string | null
          provider_name: string
          sender_pattern: string
          body_regex: string
          amount_group: string | null
          merchant_group: string | null
          ref_group: string | null
          type_group: string | null
          balance_group: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          provider_name: string
          sender_pattern: string
          body_regex: string
          amount_group?: string | null
          merchant_group?: string | null
          ref_group?: string | null
          type_group?: string | null
          balance_group?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          provider_name?: string
          sender_pattern?: string
          body_regex?: string
          amount_group?: string | null
          merchant_group?: string | null
          ref_group?: string | null
          type_group?: string | null
          balance_group?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_import_settings: {
        Row: {
          user_id: string
          sms_import_enabled: boolean
          auto_notify: boolean
          min_confidence_threshold: number
          ignored_senders: string[] | null
          monitored_accounts: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          sms_import_enabled?: boolean
          auto_notify?: boolean
          min_confidence_threshold?: number
          ignored_senders?: string[] | null
          monitored_accounts?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          sms_import_enabled?: boolean
          auto_notify?: boolean
          min_confidence_threshold?: number
          ignored_senders?: string[] | null
          monitored_accounts?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          decimals: number
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimals?: number
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimals?: number
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          as_of: string
          base: string
          id: string
          quote: string
          rate: number
        }
        Insert: {
          as_of?: string
          base: string
          id?: string
          quote: string
          rate: number
        }
        Update: {
          as_of?: string
          base?: string
          id?: string
          quote?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_base_fkey"
            columns: ["base"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exchange_rates_quote_fkey"
            columns: ["quote"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      budget_categories: {
        Row: {
          budget_id: string
          category_id: string
        }
        Insert: {
          budget_id: string
          category_id: string
        }
        Update: {
          budget_id?: string
          category_id?: string
        }
        Relationships: []
      }
      budget_periods: {
        Row: {
          budget_id: string
          carried_over_minor: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          spent_minor: number
        }
        Insert: {
          budget_id: string
          carried_over_minor?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          spent_minor?: number
        }
        Update: {
          budget_id?: string
          carried_over_minor?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          spent_minor?: number
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          period_type: string
          rollover: boolean
          start_date: string
          user_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          period_type: string
          rollover?: boolean
          start_date: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          period_type?: string
          rollover?: boolean
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loan_payments: {
        Row: {
          amount_minor: number
          id: string
          loan_id: string
          note: string | null
          paid_at: string
        }
        Insert: {
          amount_minor: number
          id?: string
          loan_id: string
          note?: string | null
          paid_at?: string
        }
        Update: {
          amount_minor?: number
          id?: string
          loan_id?: string
          note?: string | null
          paid_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          contact_id: string | null
          created_at: string
          currency: string
          description: string | null
          direction: string
          due_date: string | null
          id: string
          interest_rate: number
          is_settled: boolean
          paid_minor: number
          principal_minor: number
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          direction: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          is_settled?: boolean
          paid_minor?: number
          principal_minor: number
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          direction?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          is_settled?: boolean
          paid_minor?: number
          principal_minor?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          base_currency: string
          created_at: string
          date_format: string
          display_name: string | null
          locale: string
          notification_prefs: Json
          number_format: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          date_format?: string
          display_name?: string | null
          locale?: string
          notification_prefs?: Json
          number_format?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          date_format?: string
          display_name?: string | null
          locale?: string
          notification_prefs?: Json
          number_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string
          amount_minor: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          interval_days: number | null
          is_paused: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          last_executed_at: string | null
          name: string
          next_due_date: string
          start_date: string
          to_account_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          currency: string
          description?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval_days?: number | null
          is_paused?: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          last_executed_at?: string | null
          name: string
          next_due_date: string
          start_date: string
          to_account_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval_days?: number | null
          is_paused?: boolean
          kind?: Database["public"]["Enums"]["transaction_kind"]
          last_executed_at?: string | null
          name?: string
          next_due_date?: string
          start_date?: string
          to_account_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          amount_minor: number
          goal_id: string
          id: string
          note: string | null
          occurred_at: string
        }
        Insert: {
          amount_minor: number
          goal_id: string
          id?: string
          note?: string | null
          occurred_at?: string
        }
        Update: {
          amount_minor?: number
          goal_id?: string
          id?: string
          note?: string | null
          occurred_at?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          account_id: string | null
          color: string
          created_at: string
          currency: string
          current_minor: number
          deadline: string | null
          icon: string
          id: string
          is_completed: boolean
          name: string
          notes: string | null
          target_minor: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          color?: string
          created_at?: string
          currency?: string
          current_minor?: number
          deadline?: string | null
          icon?: string
          id?: string
          is_completed?: boolean
          name: string
          notes?: string | null
          target_minor: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          color?: string
          created_at?: string
          currency?: string
          current_minor?: number
          deadline?: string | null
          icon?: string
          id?: string
          is_completed?: boolean
          name?: string
          notes?: string | null
          target_minor?: number
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          account_id: string | null
          amount_minor: number
          billing_cycle: string
          category_id: string | null
          color: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          next_renewal_date: string
          notes: string | null
          provider_icon: string | null
          reminder_days_before: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount_minor: number
          billing_cycle: string
          category_id?: string | null
          color?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          next_renewal_date: string
          notes?: string | null
          provider_icon?: string | null
          reminder_days_before?: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount_minor?: number
          billing_cycle?: string
          category_id?: string | null
          color?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          next_renewal_date?: string
          notes?: string | null
          provider_icon?: string | null
          reminder_days_before?: number
          user_id?: string
        }
        Relationships: []
      }
      transaction_splits: {
        Row: {
          amount_minor: number
          category_id: string | null
          id: string
          note: string | null
          transaction_id: string
        }
        Insert: {
          amount_minor: number
          category_id?: string | null
          id?: string
          note?: string | null
          transaction_id: string
        }
        Update: {
          amount_minor?: number
          category_id?: string | null
          id?: string
          note?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          tag: string
          transaction_id: string
        }
        Insert: {
          tag: string
          transaction_id: string
        }
        Update: {
          tag?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount_minor: number
          base_amount_minor: number
          category_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          fx_rate: number
          id: string
          is_favorite: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          location: string | null
          merchant: string | null
          notes: string | null
          occurred_at: string
          payment_method: string | null
          reconciled: boolean
          reconciled_at: string | null
          reference_number: string | null
          to_account_id: string | null
          transfer_group_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          base_amount_minor?: number
          category_id?: string | null
          created_at?: string
          currency: string
          deleted_at?: string | null
          description?: string | null
          fx_rate?: number
          id?: string
          is_favorite?: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          location?: string | null
          merchant?: string | null
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reference_number?: string | null
          to_account_id?: string | null
          transfer_group_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          base_amount_minor?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          fx_rate?: number
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["transaction_kind"]
          location?: string | null
          merchant?: string | null
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reference_number?: string | null
          to_account_id?: string | null
          transfer_group_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_templates: {
        Row: {
          amount_minor: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          merchant: string | null
          name: string
          notes: string | null
          tags: string[] | null
          to_account_id: string | null
          account_id: string
          user_id: string
        }
        Insert: {
          amount_minor?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          merchant?: string | null
          name: string
          notes?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          account_id: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          merchant?: string | null
          name?: string
          notes?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_templates_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recompute_account_balance: {
        Args: { _account_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type:
        | "cash"
        | "bank"
        | "wallet"
        | "credit_card"
        | "debit_card"
        | "digital_wallet"
        | "savings"
        | "fixed_deposit"
        | "investment"
        | "loan"
        | "business"
        | "other"
      category_kind: "income" | "expense"
      notification_type:
        | "budget_alert"
        | "bill_reminder"
        | "subscription_reminder"
        | "loan_overdue"
        | "goal_reminder"
        | "low_balance"
        | "large_expense"
      recurrence_frequency:
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
        | "custom"
      transaction_kind: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: [
        "cash",
        "bank",
        "wallet",
        "credit_card",
        "debit_card",
        "digital_wallet",
        "savings",
        "fixed_deposit",
        "investment",
        "loan",
        "business",
        "other",
      ],
      category_kind: ["income", "expense"],
      notification_type: [
        "budget_alert",
        "bill_reminder",
        "subscription_reminder",
        "loan_overdue",
        "goal_reminder",
        "low_balance",
        "large_expense",
      ],
      recurrence_frequency: [
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
        "custom",
      ],
      transaction_kind: ["income", "expense", "transfer"],
    },
  },
} as const
