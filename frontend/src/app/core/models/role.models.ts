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
  id: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AssignPermissionsRequest {
  permissionCodes: string[];
}
