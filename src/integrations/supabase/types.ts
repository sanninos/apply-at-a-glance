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
      account_deletion_requests: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Alerta: {
        Row: {
          alert_types: string[]
          created_at: string
          id: string
          is_active: boolean
          proximity_radius_km: number
          search_business: string | null
          search_position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_types: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          proximity_radius_km?: number
          search_business?: string | null
          search_position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_types?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          proximity_radius_km?: number
          search_business?: string | null
          search_position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      anuncios_home: {
        Row: {
          activo: boolean
          created_at: string
          enlace_url: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          imagen_url: string
          orden: number
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          enlace_url?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          imagen_url: string
          orden?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          enlace_url?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          imagen_url?: string
          orden?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      Autopostulacion: {
        Row: {
          created_at: string
          cv_id: string | null
          distancia: number | null
          id: number
          latlngUser: string | null
          puestos: string[] | null
          tipoContrato: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cv_id?: string | null
          distancia?: number | null
          id?: number
          latlngUser?: string | null
          puestos?: string[] | null
          tipoContrato?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cv_id?: string | null
          distancia?: number | null
          id?: number
          latlngUser?: string | null
          puestos?: string[] | null
          tipoContrato?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      Curriculum: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          foto: string | null
          id: number
          idTablaExperiencias: string[] | null
          IdTablaFormaciones: string[] | null
          nacimiento: string | null
          presentacion: string | null
          telefono: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          foto?: string | null
          id?: number
          idTablaExperiencias?: string[] | null
          IdTablaFormaciones?: string[] | null
          nacimiento?: string | null
          presentacion?: string | null
          telefono?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          foto?: string | null
          id?: number
          idTablaExperiencias?: string[] | null
          IdTablaFormaciones?: string[] | null
          nacimiento?: string | null
          presentacion?: string | null
          telefono?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      curriculums: {
        Row: {
          created_at: string
          education: Json
          experiences: Json
          full_name: string | null
          id: string
          phone: string | null
          skills: Json
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: Json
          experiences?: Json
          full_name?: string | null
          id?: string
          phone?: string | null
          skills?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: Json
          experiences?: Json
          full_name?: string | null
          id?: string
          phone?: string | null
          skills?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          created_at: string
          email: string
          id: number
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: []
      }
      Empresa: {
        Row: {
          activo: boolean | null
          cantidadEmpleados: string | null
          ciudad: string | null
          created_at: string
          departamento: string | null
          descripcion: string | null
          direccion: string | null
          email: string | null
          id: number
          imagen: string | null
          isEmpresaPublica: boolean | null
          nombre: string | null
          owner_id: string | null
          pais: string | null
          portada_url: string | null
          rut: string | null
          sector: string | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string | null
          verificada: boolean | null
        }
        Insert: {
          activo?: boolean | null
          cantidadEmpleados?: string | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          imagen?: string | null
          isEmpresaPublica?: boolean | null
          nombre?: string | null
          owner_id?: string | null
          pais?: string | null
          portada_url?: string | null
          rut?: string | null
          sector?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
          verificada?: boolean | null
        }
        Update: {
          activo?: boolean | null
          cantidadEmpleados?: string | null
          ciudad?: string | null
          created_at?: string
          departamento?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          imagen?: string | null
          isEmpresaPublica?: boolean | null
          nombre?: string | null
          owner_id?: string | null
          pais?: string | null
          portada_url?: string | null
          rut?: string | null
          sector?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
          verificada?: boolean | null
        }
        Relationships: []
      }
      EntesPublicos: {
        Row: {
          created_at: string
          id: number
          imagen: string | null
          Inciso: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          imagen?: string | null
          Inciso?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          imagen?: string | null
          Inciso?: string | null
        }
        Relationships: []
      }
      Experiencia: {
        Row: {
          created_at: string
          descripcion: string | null
          desde: string | null
          hasta: string | null
          id: number
          idTablaCurriculum: string | null
          idTablaUsuario: string | null
          titulo: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          desde?: string | null
          hasta?: string | null
          id?: number
          idTablaCurriculum?: string | null
          idTablaUsuario?: string | null
          titulo?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          desde?: string | null
          hasta?: string | null
          id?: number
          idTablaCurriculum?: string | null
          idTablaUsuario?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      JobsDetails: {
        Row: {
          cantidadCupos: number | null
          categoria: string | null
          ciudad: string | null
          contadorVisitas: number | null
          created_at: string
          descripcion: string | null
          email_postulacion: string | null
          empleabilidad: string[] | null
          Empresa: string | null
          empresa_id: number | null
          estado_postulacion: string | null
          Estudios: string | null
          fotoEmpresa: string | null
          fuente_id: string | null
          havePoster: boolean | null
          id: number
          idEmpresa: string | null
          image: string | null
          Inciso: string | null
          isFeatured: boolean | null
          isLlamado: boolean | null
          jornada: string | null
          latLong: string | null
          llamadoFechaCierre: string | null
          llamadoFechaInicio: string | null
          llamadoId: number | null
          poster: string | null
          postulantes_cvs_ids: string[] | null
          postulantes_ids: string[] | null
          puesto: string | null
          rangoEdad: number[] | null
          requisitos: string[] | null
          salario: number | null
          telefono_postulacion: string | null
          tipo_postulacion: string | null
          tipoContrato: string | null
          titulo: string | null
          ubicacion: string | null
          UnidadEjecutora: string | null
          url_postulacion: string | null
        }
        Insert: {
          cantidadCupos?: number | null
          categoria?: string | null
          ciudad?: string | null
          contadorVisitas?: number | null
          created_at?: string
          descripcion?: string | null
          email_postulacion?: string | null
          empleabilidad?: string[] | null
          Empresa?: string | null
          empresa_id?: number | null
          estado_postulacion?: string | null
          Estudios?: string | null
          fotoEmpresa?: string | null
          fuente_id?: string | null
          havePoster?: boolean | null
          id?: number
          idEmpresa?: string | null
          image?: string | null
          Inciso?: string | null
          isFeatured?: boolean | null
          isLlamado?: boolean | null
          jornada?: string | null
          latLong?: string | null
          llamadoFechaCierre?: string | null
          llamadoFechaInicio?: string | null
          llamadoId?: number | null
          poster?: string | null
          postulantes_cvs_ids?: string[] | null
          postulantes_ids?: string[] | null
          puesto?: string | null
          rangoEdad?: number[] | null
          requisitos?: string[] | null
          salario?: number | null
          telefono_postulacion?: string | null
          tipo_postulacion?: string | null
          tipoContrato?: string | null
          titulo?: string | null
          ubicacion?: string | null
          UnidadEjecutora?: string | null
          url_postulacion?: string | null
        }
        Update: {
          cantidadCupos?: number | null
          categoria?: string | null
          ciudad?: string | null
          contadorVisitas?: number | null
          created_at?: string
          descripcion?: string | null
          email_postulacion?: string | null
          empleabilidad?: string[] | null
          Empresa?: string | null
          empresa_id?: number | null
          estado_postulacion?: string | null
          Estudios?: string | null
          fotoEmpresa?: string | null
          fuente_id?: string | null
          havePoster?: boolean | null
          id?: number
          idEmpresa?: string | null
          image?: string | null
          Inciso?: string | null
          isFeatured?: boolean | null
          isLlamado?: boolean | null
          jornada?: string | null
          latLong?: string | null
          llamadoFechaCierre?: string | null
          llamadoFechaInicio?: string | null
          llamadoId?: number | null
          poster?: string | null
          postulantes_cvs_ids?: string[] | null
          postulantes_ids?: string[] | null
          puesto?: string | null
          rangoEdad?: number[] | null
          requisitos?: string[] | null
          salario?: number | null
          telefono_postulacion?: string | null
          tipo_postulacion?: string | null
          tipoContrato?: string | null
          titulo?: string | null
          ubicacion?: string | null
          UnidadEjecutora?: string | null
          url_postulacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobsdetails_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "Empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      Notificaciones: {
        Row: {
          action_label: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_read: boolean
          occurred_at: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          occurred_at?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          occurred_at?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ofertas_guardadas: {
        Row: {
          created_at: string
          id: string
          job_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_guardadas_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "JobsDetails"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas_vistas: {
        Row: {
          id: string
          job_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      postulaciones: {
        Row: {
          created_at: string
          estado: string
          id: string
          job_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          job_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          job_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulaciones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "JobsDetails"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      publicaciones: {
        Row: {
          actualizado_en: string | null
          categoria: string | null
          contenido: string
          creado_en: string | null
          id: string
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string | null
          categoria?: string | null
          contenido: string
          creado_en?: string | null
          id?: string
          usuario_id: string
        }
        Update: {
          actualizado_en?: string | null
          categoria?: string | null
          contenido?: string
          creado_en?: string | null
          id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      Puesto: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      referencias_laborales: {
        Row: {
          cargo: string | null
          created_at: string
          empresa: string | null
          id: string
          nombre_apellido: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nombre_apellido: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          nombre_apellido?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referidos: {
        Row: {
          codigo: string
          created_at: string
          id: number
          instalado: boolean | null
          instalado_at: string | null
          recompensa_otorgada: boolean | null
          referido_id: string | null
          referidor_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: number
          instalado?: boolean | null
          instalado_at?: string | null
          recompensa_otorgada?: boolean | null
          referido_id?: string | null
          referidor_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: number
          instalado?: boolean | null
          instalado_at?: string | null
          recompensa_otorgada?: boolean | null
          referido_id?: string | null
          referidor_id?: string
        }
        Relationships: []
      }
      scraped_posts: {
        Row: {
          post_id: string
          processed_at: string
        }
        Insert: {
          post_id: string
          processed_at?: string
        }
        Update: {
          post_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      Usuario: {
        Row: {
          activo: boolean | null
          apellido: string | null
          auth_id: string | null
          created_at: string
          cv_ids: string[] | null
          cv_url: string | null
          email: string
          empresa_id: string | null
          estudios: string | null
          fcm_token: string | null
          fcm_updated_at: string | null
          fecha_nacimiento: string | null
          foto_perfil: string | null
          genero: string | null
          habilidades: string[] | null
          id: number
          membresia_usuario: string | null
          nombre: string | null
          telefono: string | null
          tipo_usuario: string | null
          ubicacion: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido?: string | null
          auth_id?: string | null
          created_at?: string
          cv_ids?: string[] | null
          cv_url?: string | null
          email: string
          empresa_id?: string | null
          estudios?: string | null
          fcm_token?: string | null
          fcm_updated_at?: string | null
          fecha_nacimiento?: string | null
          foto_perfil?: string | null
          genero?: string | null
          habilidades?: string[] | null
          id?: number
          membresia_usuario?: string | null
          nombre?: string | null
          telefono?: string | null
          tipo_usuario?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string | null
          auth_id?: string | null
          created_at?: string
          cv_ids?: string[] | null
          cv_url?: string | null
          email?: string
          empresa_id?: string | null
          estudios?: string | null
          fcm_token?: string | null
          fcm_updated_at?: string | null
          fecha_nacimiento?: string | null
          foto_perfil?: string | null
          genero?: string | null
          habilidades?: string[] | null
          id?: number
          membresia_usuario?: string | null
          nombre?: string | null
          telefono?: string | null
          tipo_usuario?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      visibility_settings: {
        Row: {
          description: string | null
          id: string
          is_visible: boolean
          label: string | null
          section_key: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_visible?: boolean
          label?: string | null
          section_key: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          is_visible?: boolean
          label?: string | null
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      postular_cv: {
        Args: { cv_id: string; job_id: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
