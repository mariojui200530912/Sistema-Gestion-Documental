export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: 'admin' | 'usuario';
  espacioUtilizado?: number;
}