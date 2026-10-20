export interface Carpeta {
  _id: string;
  nombre: string;
  carpeta_padre_id: string | null;
  propietario_id: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface Archivo {
  _id: string;
  nombre: string;
  tamano: number;
  tipo_archivo: string;
  carpeta_id: string | null;
  estado: string;
  gridfs_id: string;
  createdAt: string;
}