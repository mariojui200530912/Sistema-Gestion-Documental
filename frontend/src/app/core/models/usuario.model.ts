export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: 'administrador' | 'usuario';
  estado?: string;
  espacioUtilizado?: number;
  espacioAsignado?: number
}