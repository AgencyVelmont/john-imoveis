export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "admin" | "super_admin";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "admin" | "super_admin";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          title: string;
          slug: string;
          code: string | null;
          short_description: string | null;
          full_description: string | null;
          purpose: "venda" | "locacao";
          type: string;
          price: number | null;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          location_text: string | null;
          total_area: number | null;
          built_area: number | null;
          bedrooms: number;
          suites: number;
          bathrooms: number;
          parking_spaces: number;
          status: "rascunho" | "publicado" | "vendido" | "alugado" | "indisponivel";
          featured: boolean;
          investment_opportunity: boolean;
          internal_notes: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]> & {
          title: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          storage_path: string;
          sort_order: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          storage_path: string;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_images"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: string;
          name: string | null;
          creci: string | null;
          email: string | null;
          phone: string | null;
          instagram_url: string | null;
          site_url: string | null;
          bio: string | null;
          whatsapp_message: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          experience_years: number | null;
          properties_count: number | null;
          clients_count: number | null;
          neighborhoods_count: number | null;
          color_primary: string;
          color_secondary: string;
          color_button: string;
          color_accent: string;
          color_text: string;
          color_background: string;
          color_surface: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
      leads: {
        Row: {
          id: string;
          property_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          message: string | null;
          source: string | null;
          status: "novo" | "contato" | "visita_agendada" | "proposta" | "convertido" | "perdido";
          notes: string | null;
          notes_updated_at: string | null;
          notes_updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & { name?: string };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          normalized_phone: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
      };
      property_events: {
        Row: {
          id: string;
          property_id: string | null;
          event_type: string;
          visitor_id: string | null;
          source: string;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["property_events"]["Row"]> & {
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["property_events"]["Row"]>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string | null;
          auth: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          user_id: string;
          endpoint: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
      };
    };
  };
};
