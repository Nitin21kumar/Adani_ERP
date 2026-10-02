import { api } from "./api";
import type { Department, Employee, EmployeeCreate, EmployeeCreateResponse, EmployeeUpdate } from "@/types/employee";
import type { Role } from "@/types/auth";

export const employeeService = {
  list: (params: { search?: string; department_id?: string; status?: string }) =>
    api.get<Employee[]>("/employees", { params }).then((r) => r.data),
  get: (id: string) => api.get<Employee>(`/employees/${id}`).then((r) => r.data),
  create: (payload: EmployeeCreate) =>
    api.post<EmployeeCreateResponse>("/employees", payload).then((r) => r.data),
  update: (id: string, payload: EmployeeUpdate) =>
    api.put<Employee>(`/employees/${id}`, payload).then((r) => r.data),
  block: (id: string) => api.post<Employee>(`/employees/${id}/block`).then((r) => r.data),
  activate: (id: string) => api.post<Employee>(`/employees/${id}/activate`).then((r) => r.data),
  remove: (id: string) => api.delete(`/employees/${id}`).then((r) => r.data),
};

export const departmentService = {
  list: () => api.get<Department[]>("/departments").then((r) => r.data),
  create: (payload: { name: string; description?: string }) =>
    api.post<Department>("/departments", payload).then((r) => r.data),
};

export const roleService = {
  list: () => api.get<Role[]>("/roles").then((r) => r.data),
};
