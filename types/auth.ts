export interface User {
  id: string
  name: string
  email: string
  perfil: string
  codSucursal: string
}

export interface LoginResponse {
  codEmpleado: string
  nombre: string
  codPerfil: string
  codSucursal: string
}
