export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  permissionCodes: string[];
}

export interface AdminPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface AdminAuditLog {
  actor: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface AssignPermissionsRequest {
  permissionCodes: string[];
}
