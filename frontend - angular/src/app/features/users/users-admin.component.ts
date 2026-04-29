import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';
import { UserService, User } from '../../core/api/user.service';
import { DepartmentService, Department } from '../../core/api/department.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface UserForm {
  name: string;
  email: string;
  role: string;
  departmentId: string;
  password: string;
}

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-admin.component.html'
})
export class UsersAdminComponent implements OnInit {
  private userService = inject(UserService);
  private deptService = inject(DepartmentService);
  private toastr = inject(ToastrService);
  private auth = inject(AuthService);
  private router = inject(Router);

  users = signal<User[]>([]);
  departments = signal<Department[]>([]);
  currentUser = signal<User | null>(null);
  isLoading = signal(false);

  filterQuery = '';
  selectedDeptId = signal<string | null>(null);

  filteredUsers = computed(() => {
    const q = this.filterQuery.toLowerCase().trim();
    const list = this.users() || [];
    if (!q) return list;
    return list.filter(u => 
      (u.name?.toLowerCase() || '').includes(q) ||
      (u.email?.toLowerCase() || '').includes(q) ||
      (u.role?.toLowerCase() || '').includes(q)
    );
  });

  // Modal state - Users
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingUserId: string | null = null;
  isSubmitting = false;
  userForm: UserForm = { name: '', email: '', role: '', departmentId: '', password: '' };

  // Modal state - Departments
  deptModalOpen = signal(false);
  deptModalMode = signal<'create' | 'edit'>('create');
  editingDeptId = signal<string | null>(null);
  deptForm = { name: '', description: '' };

  readonly roles = ['ADMIN', 'MANAGER', 'OFFICER', 'CLIENT'];

  ngOnInit() {
    this.loadUsers();
    this.loadDepartments();
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.userService.getMe().subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.toastr.error('Error al cargar perfil de usuario')
    });
  }

  loadUsers() {
    console.log('Loading all organization users...');
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => {
        console.log('All users loaded:', data);
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Error al cargar la lista de usuarios');
        this.isLoading.set(false);
      }
    });
  }

  loadDepartments() {
    this.deptService.getDepartments().subscribe({
      next: (data) => this.departments.set(data),
      error: () => { /* silent – departments are optional for display */ }
    });
  }

  openAddModal() {
    this.modalMode = 'create';
    this.editingUserId = null;
    this.userForm = { name: '', email: '', role: '', departmentId: '', password: '' };
    this.modalOpen = true;
  }

  openEditModal(user: User) {
    this.modalMode = 'edit';
    this.editingUserId = user.id;
    this.userForm = {
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || '',
      password: ''
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.isSubmitting = false;
  }

  isFormValid(): boolean {
    const f = this.userForm;
    const passwordOk = this.modalMode === 'edit' || !!f.password;
    return !!(f.name && f.email && f.role && f.departmentId && passwordOk);
  }

  saveUser() {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.isSubmitting = true;

    const payload: Partial<User> = {
      name: this.userForm.name,
      email: this.userForm.email,
      role: this.userForm.role,
      departmentId: this.userForm.departmentId,
      orgId: this.currentUser()?.orgId
    };
    if (this.userForm.password) {
      payload.password = this.userForm.password;
    }

    if (this.modalMode === 'create') {
      this.userService.createUser(payload).subscribe({
        next: (created) => {
          this.users.update(list => [...list, created]);
          this.toastr.success('Usuario creado exitosamente');
          this.closeModal();
        },
        error: () => {
          this.toastr.error('Error al crear usuario');
          this.isSubmitting = false;
        }
      });
    } else if (this.editingUserId) {
      this.userService.updateUser(this.editingUserId, payload).subscribe({
        next: (updated) => {
          this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.toastr.success('Usuario actualizado exitosamente');
          this.closeModal();
        },
        error: () => {
          this.toastr.error('Error al actualizar usuario');
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteUser(user: User) {
    if (!confirm(`¿Eliminar a ${user.name}?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.toastr.success('Usuario eliminado');
      },
      error: () => this.toastr.error('Error al eliminar usuario')
    });
  }

  exportCSV() {
    const rows = this.filteredUsers();
    const header = ['Name', 'Email', 'Role', 'Status', 'Created At'];
    const lines = [
      header.join(','),
      ...rows.map(u => [
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${u.status}"`,
        `"${u.createdAt}"`
      ].join(','))
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  impersonate(userId: string) {
    if (!userId) {
      this.toastr.warning('User ID inválido');
      return;
    }

    this.userService.impersonate(userId).subscribe({
      next: (res: any) => {
        this.auth.login({
          token: res.accessToken || res.token,
          role: res.userProfile?.role || res.role,
          userId: res.userProfile?.id || userId,
          userName: res.userProfile?.name || 'Impersonated User',
          orgSlug: res.userProfile?.orgSlug,
          orgName: res.userProfile?.orgName
        });

        this.toastr.success('Has cambiado de identidad exitosamente', 'Impersonado');
        this.router.navigate(['/']);
      },
      error: () => this.toastr.error('No se pudo impersonar al usuario')
    });
  }

  // --- Department Management ---

  openDeptModal(mode: 'create' | 'edit', dept?: Department) {
    this.deptModalMode.set(mode);
    if (mode === 'edit' && dept) {
      this.editingDeptId.set(dept.id);
      this.deptForm = { name: dept.name, description: dept.description || '' };
    } else {
      this.editingDeptId.set(null);
      this.deptForm = { name: '', description: '' };
    }
    this.deptModalOpen.set(true);
  }

  closeDeptModal() {
    this.deptModalOpen.set(false);
  }

  saveDepartment() {
    if (!this.deptForm.name) return;

    if (this.deptModalMode() === 'create') {
      this.deptService.createDepartment(this.deptForm).subscribe({
        next: () => {
          this.toastr.success('Departamento creado');
          this.loadDepartments();
          this.closeDeptModal();
        },
        error: () => this.toastr.error('Error al crear departamento')
      });
    } else if (this.editingDeptId()) {
      this.deptService.updateDepartment(this.editingDeptId()!, this.deptForm).subscribe({
        next: () => {
          this.toastr.success('Departamento actualizado');
          this.loadDepartments();
          this.closeDeptModal();
        },
        error: () => this.toastr.error('Error al actualizar departamento')
      });
    }
  }

  deleteDepartment(id: string) {
    if (!confirm('¿Eliminar este departamento?')) return;
    this.deptService.deleteDepartment(id).subscribe({
      next: () => {
        this.toastr.success('Departamento eliminado');
        this.loadDepartments();
      },
      error: () => this.toastr.error('Error al eliminar departamento')
    });
  }

  selectDepartment(deptId: string | null) {
    console.log('Selected Department ID:', deptId);
    this.selectedDeptId.set(deptId);
    if (!deptId) {
      this.loadUsers();
    } else {
      this.isLoading.set(true);
      this.deptService.getDepartmentMembers(deptId).subscribe({
        next: (members) => {
          console.log('Department members received:', members);
          this.users.set(members);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastr.error('Error al cargar miembros del departamento');
          this.isLoading.set(false);
        }
      });
    }
  }
}
