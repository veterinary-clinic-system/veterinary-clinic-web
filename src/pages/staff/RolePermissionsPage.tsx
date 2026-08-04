import { Fragment, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionCode, permissionsApi } from '@/api/permissions.api';
import { Badge, Button, useToast } from '@/components/basic';
import { Role } from '@/types/enums';
import { getErrorMessage } from '@/utils/errors';
import { ROLE_LABEL_VI } from '@/utils/labels';

/**
 * Ma trận vai trò × quyền — SRS FR-02, BR-16 (chỉ Admin).
 *
 * Cột ADMIN hiển thị nhưng khóa cứng: backend từ chối mọi thay đổi quyền của Admin để
 * quản trị viên không tự khóa mình ra ngoài hệ thống. Không ẩn cột đi, vì người dùng
 * cần thấy Admin có toàn quyền — ẩn sẽ khiến bảng trông như Admin không có quyền nào.
 */
export function RolePermissionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const catalogQuery = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => permissionsApi.catalog(),
  });
  const matrixQuery = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: () => permissionsApi.matrix(),
  });

  /** Bản nháp cục bộ: tick nhiều ô rồi mới lưu một lần cho mỗi vai trò. */
  const [draft, setDraft] = useState<Record<string, Set<PermissionCode>>>({});

  useEffect(() => {
    if (!matrixQuery.data) return;
    setDraft(
      Object.fromEntries(matrixQuery.data.map((row) => [row.role, new Set(row.permissions)])),
    );
  }, [matrixQuery.data]);

  const roles = useMemo(
    () => (matrixQuery.data ?? []).map((row) => row.role),
    [matrixQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (role: Role) =>
      permissionsApi.setRolePermissions(role, [...(draft[role] ?? new Set())]),
    onSuccess: (result) => {
      toast.show(
        `Đã lưu ${result.permissions.length} quyền cho ${ROLE_LABEL_VI[result.role]}.`,
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: (role: Role) => permissionsApi.resetRole(role),
    onSuccess: (result) => {
      toast.show(`Đã khôi phục quyền mặc định cho ${ROLE_LABEL_VI[result.role]}.`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function toggle(role: Role, permission: PermissionCode) {
    setDraft((prev) => {
      const next = new Set(prev[role] ?? []);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return { ...prev, [role]: next };
    });
  }

  function isDirty(role: Role): boolean {
    const saved = matrixQuery.data?.find((row) => row.role === role);
    if (!saved) return false;
    const current = draft[role] ?? new Set();
    return (
      saved.permissions.length !== current.size ||
      saved.permissions.some((permission) => !current.has(permission))
    );
  }

  if (catalogQuery.isLoading || matrixQuery.isLoading) {
    return <p className="text-muted">Đang tải…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Phân quyền</h1>
        <p className="mt-1 text-sm text-muted">
          Backend kiểm tra quyền trên từng thao tác. Thay đổi có hiệu lực trong vòng một phút.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) =>
          role === Role.ADMIN ? null : (
            <div key={role} className="flex items-center gap-1.5">
              <Button
                size="sm"
                disabled={!isDirty(role)}
                loading={saveMutation.isPending && saveMutation.variables === role}
                onClick={() => saveMutation.mutate(role)}
              >
                Lưu {ROLE_LABEL_VI[role]}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={resetMutation.isPending && resetMutation.variables === role}
                onClick={() => resetMutation.mutate(role)}
                title="Khôi phục bộ quyền mặc định theo SRS"
              >
                ↺
              </Button>
            </div>
          ),
        )}
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-muted">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Quyền</th>
              {roles.map((role) => (
                <th key={role} className="px-3 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{ROLE_LABEL_VI[role]}</span>
                    {role === Role.ADMIN && <Badge variant="outline">Toàn quyền</Badge>}
                    {role !== Role.ADMIN && isDirty(role) && (
                      <Badge variant="warning">Chưa lưu</Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(catalogQuery.data ?? []).map((group) => (
              // Fragment cần key vì nằm trong map — dùng `<>` sẽ bị React cảnh báo lúc chạy.
              <Fragment key={group.group}>
                <tr className="border-t border-border bg-surface-muted/50">
                  <td colSpan={roles.length + 1} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    {group.group}
                  </td>
                </tr>
                {group.permissions.map((permission) => (
                  <tr key={permission} className="border-t border-border hover:bg-surface-muted/40">
                    <td className="px-3 py-1.5 font-mono text-xs">{permission}</td>
                    {roles.map((role) => (
                      <td key={role} className="px-3 py-1.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${permission} cho ${ROLE_LABEL_VI[role]}`}
                          checked={
                            role === Role.ADMIN ? true : (draft[role]?.has(permission) ?? false)
                          }
                          disabled={role === Role.ADMIN}
                          onChange={() => toggle(role, permission)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
