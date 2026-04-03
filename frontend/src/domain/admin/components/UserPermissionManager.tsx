import { useState, type FC } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { adminApi } from "../api/adminApi.ts";
import type { AdminUserSearchResult, UserRole } from "../types.ts";

const ROLES: UserRole[] = ["GUEST", "HOST", "ADMIN"];

export const UserPermissionManager: FC = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await adminApi.searchUsers(query.trim());
      setUsers(data);
    } catch {
      toast.error("사용자 검색에 실패했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    if (!window.confirm(`권한을 ${newRole}(으)로 변경하시겠습니까?`)) return;

    setChangingId(userId);
    try {
      const { data } = await adminApi.changeUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
      toast.success("권한이 변경되었습니다.");
    } catch {
      toast.error("권한 변경에 실패했습니다.");
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="user-permission-manager">
      <div className="search-bar flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="이메일 또는 닉네임 검색"
          className="search-input flex-1 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="search-button px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
        >
          <IoSearchOutline className="text-lg" />
        </button>
      </div>

      {users.length > 0 && (
        <div className="user-list space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="user-item flex items-center justify-between gap-3 p-3 bg-bg-secondary rounded-xl"
            >
              <div className="user-info flex items-center gap-3 min-w-0">
                <img
                  src={user.profileImageUrl ?? undefined}
                  alt=""
                  className="user-avatar w-9 h-9 rounded-full object-cover bg-bg-primary border border-border"
                />
                <div className="user-details min-w-0">
                  <p className="user-nickname text-sm font-medium text-text-primary truncate">
                    {user.nickname}
                  </p>
                  <p className="user-email text-xs text-text-secondary truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                disabled={changingId === user.id}
                className="role-select px-3 py-1.5 text-xs font-medium bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && !isSearching && query && (
        <p className="search-empty text-sm text-text-secondary text-center py-4">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
};
