import { api } from "~/utils/api";

export function useUserRole() {
    const { data } = api.getUserRole.useQuery()
    return data || {
        isTeacher: true,
        isAdmin: false,
    }
}