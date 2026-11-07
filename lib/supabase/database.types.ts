
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bookings": {
                  Row: {
                    "conversation_id": string,"created_at": string,"dorm_id": string,"held_until": string | null,"id": string,"months": number,"move_in_date": string,"note": string | null,"owner_id": string,"room_id": string | null,"room_type_id": string,"status": Database["public"]['Enums']["booking_status"],"tenant_id": string,"updated_at": string,"booking_label": string | null
                  }
                  ComputedFields: "booking_label"
                  Insert: {
                    "conversation_id": string,"created_at"?: string,"dorm_id": string,"held_until"?: string | null,"id"?: string,"months": number,"move_in_date": string,"note"?: string | null,"owner_id": string,"room_id"?: string | null,"room_type_id": string,"status"?: Database["public"]['Enums']["booking_status"],"tenant_id": string,"updated_at"?: string
                  }
                  Update: {
                    "conversation_id"?: string,"created_at"?: string,"dorm_id"?: string,"held_until"?: string | null,"id"?: string,"months"?: number,"move_in_date"?: string,"note"?: string | null,"owner_id"?: string,"room_id"?: string | null,"room_type_id"?: string,"status"?: Database["public"]['Enums']["booking_status"],"tenant_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_room_id_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "rooms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_room_type_id_fkey"
      columns: ["room_type_id"]
isOneToOne: false
      referencedRelation: "room_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"dorm_id": string,"id": string,"last_message_at": string,"owner_id": string,"owner_last_read_at": string,"tenant_id": string,"tenant_last_read_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dorm_id": string,"id"?: string,"last_message_at"?: string,"owner_id": string,"owner_last_read_at"?: string,"tenant_id": string,"tenant_last_read_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"dorm_id"?: string,"id"?: string,"last_message_at"?: string,"owner_id"?: string,"owner_last_read_at"?: string,"tenant_id"?: string,"tenant_last_read_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"dorm_photos": {
                  Row: {
                    "created_at": string,"dorm_id": string,"id": string,"sort_order": number,"storage_path": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dorm_id": string,"id"?: string,"sort_order"?: number,"storage_path"?: string | null,"url": string
                  }
                  Update: {
                    "created_at"?: string,"dorm_id"?: string,"id"?: string,"sort_order"?: number,"storage_path"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dorm_photos_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    }
                  ]
                },"dorms": {
                  Row: {
                    "address": string | null,"amenities": (string)[],"cover_url": string | null,"created_at": string,"description": string | null,"district": string | null,"gender_policy": Database["public"]['Enums']["gender_policy"],"id": string,"lat": number | null,"lng": number | null,"name": string,"nearby": (string)[],"owner_id": string,"province": string | null,"rules": string | null,"status": Database["public"]['Enums']["dorm_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"amenities"?: (string)[],"cover_url"?: string | null,"created_at"?: string,"description"?: string | null,"district"?: string | null,"gender_policy"?: Database["public"]['Enums']["gender_policy"],"id"?: string,"lat"?: number | null,"lng"?: number | null,"name": string,"nearby"?: (string)[],"owner_id": string,"province"?: string | null,"rules"?: string | null,"status"?: Database["public"]['Enums']["dorm_status"],"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"amenities"?: (string)[],"cover_url"?: string | null,"created_at"?: string,"description"?: string | null,"district"?: string | null,"gender_policy"?: Database["public"]['Enums']["gender_policy"],"id"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string,"nearby"?: (string)[],"owner_id"?: string,"province"?: string | null,"rules"?: string | null,"status"?: Database["public"]['Enums']["dorm_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dorms_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"line_links": {
                  Row: {
                    "created_at": string,"line_user_id": string | null,"link_code": string | null,"linked_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"line_user_id"?: string | null,"link_code"?: string | null,"linked_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"line_user_id"?: string | null,"link_code"?: string | null,"linked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "line_links_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"booking_id": string | null,"conversation_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["message_kind"],"sender_id": string | null,"via": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"booking_id"?: string | null,"conversation_id": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"sender_id"?: string | null,"via"?: string | null
                  }
                  Update: {
                    "body"?: string,"booking_id"?: string | null,"conversation_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"sender_id"?: string | null,"via"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"kind": string,"line_sent_at": string | null,"link": string | null,"read_at": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"line_sent_at"?: string | null,"link"?: string | null,"read_at"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"line_sent_at"?: string | null,"link"?: string | null,"read_at"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"owner_verifications": {
                  Row: {
                    "created_at": string,"document_path": string,"id": string,"note": string | null,"owner_id": string,"reviewed_at": string | null,"reviewer_note": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"document_path": string,"id"?: string,"note"?: string | null,"owner_id": string,"reviewed_at"?: string | null,"reviewer_note"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"document_path"?: string,"id"?: string,"note"?: string | null,"owner_id"?: string,"reviewed_at"?: string | null,"reviewer_note"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "owner_verifications_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"],"updated_at": string,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string,"verified_at"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"dorm_id": string,"id": string,"reason": string,"reporter_id": string,"resolved_at": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"dorm_id": string,"id"?: string,"reason": string,"reporter_id": string,"resolved_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"dorm_id"?: string,"id"?: string,"reason"?: string,"reporter_id"?: string,"resolved_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "body": string | null,"booking_id": string,"created_at": string,"dorm_id": string,"id": string,"rating": number,"tenant_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"booking_id": string,"created_at"?: string,"dorm_id": string,"id"?: string,"rating": number,"tenant_id": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"booking_id"?: string,"created_at"?: string,"dorm_id"?: string,"id"?: string,"rating"?: number,"tenant_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_tenant_id_fkey"
      columns: ["tenant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"room_type_watches": {
                  Row: {
                    "created_at": string,"room_type_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"room_type_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"room_type_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "room_type_watches_room_type_id_fkey"
      columns: ["room_type_id"]
isOneToOne: false
      referencedRelation: "room_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "room_type_watches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"room_types": {
                  Row: {
                    "advance_months": number,"created_at": string,"deposit": number,"dorm_id": string,"electric_rate": number | null,"furniture": (string)[],"id": string,"monthly_price": number,"name": string,"other_fees": NonNullable<Json>,"size_sqm": number | null,"updated_at": string,"water_flat": number | null,"water_rate": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "advance_months"?: number,"created_at"?: string,"deposit"?: number,"dorm_id": string,"electric_rate"?: number | null,"furniture"?: (string)[],"id"?: string,"monthly_price": number,"name": string,"other_fees"?: NonNullable<Json>,"size_sqm"?: number | null,"updated_at"?: string,"water_flat"?: number | null,"water_rate"?: number | null
                  }
                  Update: {
                    "advance_months"?: number,"created_at"?: string,"deposit"?: number,"dorm_id"?: string,"electric_rate"?: number | null,"furniture"?: (string)[],"id"?: string,"monthly_price"?: number,"name"?: string,"other_fees"?: NonNullable<Json>,"size_sqm"?: number | null,"updated_at"?: string,"water_flat"?: number | null,"water_rate"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "room_types_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    }
                  ]
                },"rooms": {
                  Row: {
                    "created_at": string,"dorm_id": string,"floor": number,"held_until": string | null,"id": string,"room_no": string,"room_type_id": string,"status": Database["public"]['Enums']["room_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dorm_id": string,"floor"?: number,"held_until"?: string | null,"id"?: string,"room_no": string,"room_type_id": string,"status"?: Database["public"]['Enums']["room_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"dorm_id"?: string,"floor"?: number,"held_until"?: string | null,"id"?: string,"room_no"?: string,"room_type_id"?: string,"status"?: Database["public"]['Enums']["room_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rooms_dorm_id_fkey"
      columns: ["dorm_id"]
isOneToOne: false
      referencedRelation: "dorms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rooms_room_type_id_fkey"
      columns: ["room_type_id"]
isOneToOne: false
      referencedRelation: "room_types"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "booking_label":
{ Args: { "target": Omit<Database["public"]['Tables']["bookings"]['Row'], Database["public"]['Tables']["bookings"]['ComputedFields']> }; Returns: string
                           },
"cancel_booking":
{ Args: { "target_booking_id": string }; Returns: undefined
                           },
"create_line_link_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"dorm_is_published":
{ Args: { "target_dorm_id": string }; Returns: boolean
                           },
"expire_booking_holds":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_owner":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_participant":
{ Args: { "target_conversation_id": string }; Returns: boolean
                           },
"notify":
{ Args: { "body": string,"kind": string,"link": string,"target": string,"title": string }; Returns: undefined
                           },
"owns_dorm":
{ Args: { "target_dorm_id": string }; Returns: boolean
                           },
"request_booking":
{ Args: { "target_conversation_id": string,"target_months": number,"target_move_in": string,"target_note"?: string,"target_room_type_id": string }; Returns: string
                           },
"respond_booking":
{ Args: { "action": string,"hold_hours"?: number,"target_booking_id": string,"target_room_id"?: string }; Returns: undefined
                           },
"review_verification":
{ Args: { "approve": boolean,"message"?: string,"target_id": string }; Returns: undefined
                           },
"search_dorms":
{ Args: { "amenity_filter"?: (string)[],"bbox"?: (number)[],"gender_filter"?: Database["public"]['Enums']["gender_policy"],"page_offset"?: number,"page_size"?: number,"price_max"?: number,"price_min"?: number,"province_filter"?: string,"q"?: string,"sort"?: string,"vacant_only"?: boolean }; Returns: {
              "amenities": (string)[],"cover_url": string,"district": string,"gender_policy": Database["public"]['Enums']["gender_policy"],"id": string,"lat": number,"lng": number,"max_price": number,"min_price": number,"name": string,"nearby": (string)[],"province": string,"total_count": number,"total_rooms": number,"updated_at": string,"vacant_rooms": number
            }[]
                           }
          }
          Enums: {
            "booking_status": "pending"|"held"|"confirmed"|"declined"|"cancelled"|"expired","dorm_status": "draft"|"published"|"archived","gender_policy": "male"|"female"|"mixed","message_kind": "text"|"booking"|"system","room_status": "vacant"|"held"|"occupied"|"maintenance","user_role": "tenant"|"owner"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "booking_status": ["pending", "held", "confirmed", "declined", "cancelled", "expired"],"dorm_status": ["draft", "published", "archived"],"gender_policy": ["male", "female", "mixed"],"message_kind": ["text", "booking", "system"],"room_status": ["vacant", "held", "occupied", "maintenance"],"user_role": ["tenant", "owner", "admin"]
          }
        }
} as const
