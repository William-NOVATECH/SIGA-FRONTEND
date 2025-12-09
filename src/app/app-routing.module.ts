import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DefaultContentComponent } from './navigation/default-content.component';

const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  // Ruta del admin-layout (pantalla de módulos por rol)
  {
    path: 'admin-layout',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard]
  },
  // Ruta principal CON navbar siempre visible
  { 
    path: '', 
    component: NavbarComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        component: DefaultContentComponent
      },
      { 
        path: 'departamentos', 
        loadChildren: () => import('./features/departamentos/departamentos.module').then(m => m.DepartamentosModule) 
      },
      { 
        path: 'carreras', 
        loadChildren: () => import('./features/carreras/carreras.module').then(m => m.CarrerasModule) 
      },
      { 
        path: 'asignaturas', 
        loadChildren: () => import('./features/asignaturas/asignaturas.module').then(m => m.AsignaturasModule) 
      },
      { 
        path: 'docentes', 
        loadChildren: () => import('./features/docentes/docentes.module').then(m => m.DocentesModule) 
      },
      { 
        path: 'grupos', 
        loadChildren: () => import('./features/grupos/grupos.module').then(m => m.GruposModule) 
      },
      {
        path: 'grupo-asignatura-docente',
        loadChildren: () => import('./features/grupo-asignatura-docente/grupo-asignatura-docente.module').then(m => m.GrupoAsignaturaDocenteModule)
      },
      {
        path: 'carga-docente',
        loadChildren: () => import('./features/grupo-asignatura-docente/grupo-asignatura-docente.module').then(m => m.GrupoAsignaturaDocenteModule)
      },
      {
        path: 'planes',
        loadChildren: () => import('./features/planes/planes.module').then(m => m.PlanesModule)
      },
      { 
        path: 'admin', 
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) 
      },
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }