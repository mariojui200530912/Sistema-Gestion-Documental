import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth-guard';
import { PapeleraComponent } from './features/dashboard/pages/papelera/papelera.component';
import { MiUnidadComponent } from './features/dashboard/pages/mi-unidad/mi-unidad.component';
import { CompartidosComponent } from './features/dashboard/pages/compartidos/compartidos.component';
import { ReportesComponent } from './features/dashboard/pages/reportes/reportes.component';
import { UsuariosComponent } from './features/dashboard/pages/usuarios/usuarios.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { 
        path: 'dashboard', 
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'mi-unidad', pathMatch: 'full' }, // Ruta por defecto
            { path: 'mi-unidad', component: MiUnidadComponent },
            { path: 'compartidos', component: CompartidosComponent},
            { path: 'compartidos/carpeta', component: MiUnidadComponent },
            { path: 'papelera', component: PapeleraComponent },
            { path: 'reportes', component: ReportesComponent },
            { path: 'usuarios', component: UsuariosComponent },
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
